def test_oncall_agent_wakes_up_on_alert_webhook(client):
    payload = {
        "alert_name": "HighVotingErrorRateAlert",
        "severity": "critical",
        "symptoms": "Over 12% 5xx errors recorded on /api/votes endpoint in the last 60 seconds."
    }
    response = client.post("/api/alerts/webhook", json=payload)
    assert response.status_code == 200
    incident = response.json()

    assert incident["id"] is not None
    assert incident["alert_name"] == "HighVotingErrorRateAlert"
    assert incident["status"] == "resolved"
    assert incident["root_cause"] is not None
    assert incident["remediation_action"] is not None
    assert incident["postmortem_md"] is not None
    assert "Incident Postmortem" in incident["postmortem_md"]

def test_simulate_alert_and_list_incidents(client):
    # Simulate flood alert
    sim_res = client.post("/api/alerts/simulate?alert_type=voting_flood&severity=warning")
    assert sim_res.status_code == 200
    assert sim_res.json()["alert_name"] == "VotingVelocityAnomalyAlert"

    # Verify incident appears in incident list
    list_res = client.get("/api/alerts/incidents")
    assert list_res.status_code == 200
    incidents = list_res.json()
    assert len(incidents) >= 1
    assert any(i["alert_name"] == "VotingVelocityAnomalyAlert" for i in incidents)

def test_telemetry_and_metrics_endpoints(client):
    # Check Prometheus scrape endpoint
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    assert "http_requests_total" in metrics_res.text

    # Check telemetry traces endpoint
    traces_res = client.get("/api/telemetry/traces")
    assert traces_res.status_code == 200
    assert isinstance(traces_res.json(), list)

    # Check telemetry logs endpoint
    logs_res = client.get("/api/telemetry/logs")
    assert logs_res.status_code == 200
    assert isinstance(logs_res.json(), list)
