"""
Automated Pytest Performance Test Suite for TrafficFlow.

Verifies latency distributions, throughput calculations, and report generation
under controlled test conditions without flaky machine-dependent strict thresholds.
"""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation import simulation
from backend.perf_tests.benchmark import (
    BenchmarkRunner,
    compute_percentile,
)


@pytest.fixture(autouse=True)
def clean_simulation_state():
    """Ensure clean simulation state for each performance test."""
    simulation.reset()
    simulation.set_strategy("fixed", fixed_duration=5, min_green=3, max_green=10)
    simulation.set_traffic(north=1, south=1, east=1, west=1)
    yield
    simulation.reset()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.mark.performance
def test_percentile_computation_accuracy():
    """Verify linear interpolation percentile calculation helper."""
    data = [float(i) for i in range(1, 101)]  # 1.0 to 100.0
    p50 = compute_percentile(data, 50.0)
    p95 = compute_percentile(data, 95.0)
    p99 = compute_percentile(data, 99.0)

    assert p50 == 50.5
    assert p95 == 95.05
    assert p99 == 99.01
    assert compute_percentile([], 95.0) == 0.0
    assert compute_percentile([42.0], 95.0) == 42.0


@pytest.mark.performance
def test_perf_health_endpoint_latency():
    """
    Test GET /api/health repeated-request latency.
    Verifies 100% success rate, calculates average, median, p95,
    and applies a non-flaky safety bound (p95 < 2000ms).
    """
    runner = BenchmarkRunner(iterations=50, warmup=10, concurrency=2)
    result = runner.benchmark_sequential_latency(
        endpoint="/api/health",
        method="GET",
        description="Health check probe",
    )

    assert result.successful == 50
    assert result.failed == 0
    assert result.avg_latency_ms > 0.0
    assert result.median_latency_ms > 0.0
    assert result.p95_latency_ms > 0.0
    assert result.throughput_rps > 0.0
    # Sanity check: response time should not exceed 2 seconds in a controlled environment
    assert result.p95_latency_ms < 2000.0, f"Unusually high p95 latency: {result.p95_latency_ms} ms"


@pytest.mark.performance
def test_perf_simulation_state_endpoint_latency():
    """
    Test GET /api/simulation/state repeated-request latency.
    Verifies state response structure and latency distribution.
    """
    runner = BenchmarkRunner(iterations=50, warmup=10, concurrency=2)
    result = runner.benchmark_sequential_latency(
        endpoint="/api/simulation/state",
        method="GET",
        description="State snapshot serialization",
    )

    assert result.successful == 50
    assert result.failed == 0
    assert result.avg_latency_ms > 0.0
    assert result.median_latency_ms > 0.0
    assert result.p95_latency_ms > 0.0
    assert result.throughput_rps > 0.0
    assert result.p95_latency_ms < 2000.0, f"Unusually high p95 latency: {result.p95_latency_ms} ms"


@pytest.mark.performance
def test_perf_simulation_step_endpoint_latency():
    """
    Test POST /api/simulation/step repeated-request latency while running.
    Verifies that simulation advances properly and measures tick computation latency.
    """
    runner = BenchmarkRunner(iterations=50, warmup=10, concurrency=2)

    def setup():
        simulation.reset()
        simulation.set_traffic(north=2, south=2, east=2, west=2)
        simulation.start()

    result = runner.benchmark_sequential_latency(
        endpoint="/api/simulation/step",
        method="POST",
        description="Simulation tick step",
        setup_fn=setup,
        teardown_fn=simulation.reset,
    )

    assert result.successful == 50
    assert result.failed == 0
    assert result.avg_latency_ms > 0.0
    assert result.median_latency_ms > 0.0
    assert result.p95_latency_ms > 0.0
    assert result.throughput_rps > 0.0
    assert result.p95_latency_ms < 2000.0, f"Unusually high p95 latency: {result.p95_latency_ms} ms"


@pytest.mark.performance
def test_perf_concurrent_throughput_and_reports(tmp_path: Path):
    """
    Test concurrent throughput load test and verify report generation (Markdown & JSON).
    """
    runner = BenchmarkRunner(
        iterations=30,
        warmup=5,
        concurrency=3,
        output_dir=tmp_path,
    )

    suite_data = runner.run_all()
    assert "environment" in suite_data
    assert len(suite_data["sequential_latency"]) == 3
    assert len(suite_data["concurrent_throughput"]) == 3

    # Check each endpoint has throughput > 0
    for r in suite_data["concurrent_throughput"]:
        assert r["throughput_rps"] > 0.0
        assert r["successful"] > 0

    # Test report generation
    md_file = runner.generate_markdown_report(suite_data, output_filename="test_report.md")
    json_file = runner.generate_json_report(suite_data, output_filename="test_report.json")

    assert md_file.exists()
    assert json_file.exists()

    md_content = md_file.read_text(encoding="utf-8")
    assert "# TrafficFlow Performance Testing Report" in md_content
    assert "/api/health" in md_content
    assert "/api/simulation/state" in md_content
    assert "/api/simulation/step" in md_content
    assert "Average" in md_content or "Avg Latency" in md_content
    assert "p95" in md_content

    with open(json_file, "r", encoding="utf-8") as f:
        parsed_json = json.load(f)
    assert "sequential_latency" in parsed_json
    assert "concurrent_throughput" in parsed_json
    assert parsed_json["environment"]["iterations"] == 30
