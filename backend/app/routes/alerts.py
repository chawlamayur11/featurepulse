from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Incident
from app.schemas import AlertTriggerRequest, IncidentResponse
from app.agent.oncall import OnCallResponderAgent
from app.telemetry.metrics import ALERTS_TRIGGERED_TOTAL
from app.telemetry.logger import current_trace_id

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.post("/webhook", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
def alert_webhook(payload: AlertTriggerRequest, db: Session = Depends(get_db)):
    """
    Standard AlertManager / Monitoring webhook receiver.
    Wakes up the autonomous On-Call Responder Agent to remediate the incident.
    """
    ALERTS_TRIGGERED_TOTAL.labels(alert_name=payload.alert_name, severity=payload.severity).inc()

    agent = OnCallResponderAgent(db=db)
    incident = agent.handle_alert(
        alert_name=payload.alert_name,
        severity=payload.severity,
        symptoms=payload.symptoms,
        trigger_trace_id=current_trace_id.get()
    )
    return incident

@router.post("/simulate", response_model=IncidentResponse)
def simulate_alert(
    alert_type: str = "high_error_rate",
    severity: str = "critical",
    db: Session = Depends(get_db)
):
    """
    Simulates a production incident alert for testing & live demonstration.
    """
    if alert_type == "voting_flood":
        name = "VotingVelocityAnomalyAlert"
        symptoms = "Voting velocity exceeded 80 votes/sec on post #1. Suspected automated spambot cluster."
    else:
        name = "HighVotingErrorRateAlert"
        symptoms = "Error rate exceeded 8.4% on POST /api/votes over the last 60 seconds. Users observing 500 status codes."

    ALERTS_TRIGGERED_TOTAL.labels(alert_name=name, severity=severity).inc()

    agent = OnCallResponderAgent(db=db)
    incident = agent.handle_alert(
        alert_name=name,
        severity=severity,
        symptoms=symptoms,
        trigger_trace_id=current_trace_id.get()
    )
    return incident

@router.get("/incidents", response_model=List[IncidentResponse])
def list_incidents(limit: int = 20, db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(desc(Incident.created_at)).limit(limit).all()
    return incidents
