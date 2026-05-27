from database import SessionLocal
from models import PatientRecord


def save_record(user_input, symptoms, diagnosis):
    db = SessionLocal()

    record = PatientRecord(
        user_input=user_input,
        symptoms=str(symptoms),
        diagnosis=str(diagnosis)
    )

    db.add(record)
    db.commit()
    db.close()