from symptom_extractor import extract_clinical_features
from medical_reasoner import medical_reasoning

def run_medical_pipeline(user_input):

    clinical_data = extract_clinical_features(user_input)

    diagnosis = medical_reasoning(clinical_data, user_input)

    return {
        "clinical_data": clinical_data,
        "diagnosis": diagnosis
    }