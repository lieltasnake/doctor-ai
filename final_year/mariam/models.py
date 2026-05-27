from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, Text

Base = declarative_base()

class PatientRecord(Base):
    __tablename__ = "patient_records"

    id = Column(Integer, primary_key=True)
    user_input = Column(Text)
    symptoms = Column(Text)
    diagnosis = Column(Text)