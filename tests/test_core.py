import pytest

from core import (DatasetError, classify_water_quality, generate_alert, parse_csv,
                  process_readings, simulate_session, validate_data)

GOOD = {"timestamp": "2026-10-01 06:00", "ph": 7.2, "turbidity_ntu": 2.0, "tds_ppm": 300.0,
        "dissolved_oxygen_mgL": 8.0, "temperature_c": 24.0}


def reading(**overrides):
    return {**GOOD, **overrides}


def test_safe_reading():
    assert classify_water_quality(GOOD) == ("SAFE", [])


@pytest.mark.parametrize("value", [6.5, 8.5])
def test_ph_boundaries_are_safe(value):
    assert classify_water_quality(reading(ph=value))[0] == "SAFE"


def test_single_breach_is_warning():
    status, breaches = classify_water_quality(reading(turbidity_ntu=5.5))
    assert status == "WARNING" and breaches == ["turbidity_ntu"]


def test_two_breaches_is_unsafe():
    status, breaches = classify_water_quality(reading(ph=9.1, tds_ppm=700))
    assert status == "UNSAFE" and set(breaches) == {"ph", "tds_ppm"}


def test_validate_rejects_impossible_values():
    ok, errors = validate_data(reading(ph=15, turbidity_ntu=-1, tds_ppm=-5, dissolved_oxygen_mgL=-2))
    assert not ok and len(errors) == 4


def test_validate_accepts_good_reading():
    assert validate_data(GOOD) == (True, [])


def test_generate_alert():
    assert generate_alert(GOOD, "SAFE", []) is None
    assert "[WARNING]" in generate_alert(GOOD, "WARNING", ["ph"])


def test_process_readings_summary_and_rejection():
    result = process_readings([GOOD, reading(ph=9.0), reading(ph=-3)])
    assert result["summary"]["total"] == 2
    assert result["summary"]["counts"] == {"SAFE": 1, "WARNING": 1, "UNSAFE": 0}
    assert len(result["rejected"]) == 1 and len(result["alerts"]) == 1


def test_process_empty_list():
    assert process_readings([])["summary"]["total"] == 0


def test_simulation_matches_reference_split():
    result = process_readings(simulate_session(40, seed=42))
    assert result["summary"]["total"] == 40
    assert result["summary"]["counts"]["UNSAFE"] > 0


def test_simulation_is_reproducible():
    first = simulate_session(10, seed=1)
    second = simulate_session(10, seed=1)
    assert first == second
    assert simulate_session(10, seed=2) != first


def test_parse_csv_ok():
    text = "timestamp,ph,turbidity_ntu,tds_ppm,dissolved_oxygen_mgL,temperature_c\n2026-10-01 06:00,7,2,300,8,24\n"
    assert parse_csv(text)[0]["ph"] == 7.0


@pytest.mark.parametrize("text", [
    "timestamp,ph\n2026,7\n",
    "timestamp,ph,turbidity_ntu,tds_ppm,dissolved_oxygen_mgL,temperature_c\n",
    "timestamp,ph,turbidity_ntu,tds_ppm,dissolved_oxygen_mgL,temperature_c\nt,abc,1,1,1,1\n",
])
def test_parse_csv_rejects_bad_input(text):
    with pytest.raises(DatasetError):
        parse_csv(text)
