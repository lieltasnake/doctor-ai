UNSAFE_PREGNANCY_MEDS = [
    "ibuprofen",
    "naproxen",
    "diclofenac"
]

DANGEROUS_HALLUCINATIONS = [
    "preterm labor",
    "immediate surgery",
    "terminal cancer"
]


def validate_medical_response(response_text):

    text = response_text.lower()

    warnings = []

    # =========================================
    # UNSAFE PREGNANCY MEDICATION CHECK
    # =========================================
    for med in UNSAFE_PREGNANCY_MEDS:

        if med in text:

            warnings.append(
                f"Unsafe pregnancy medication detected: {med}"
            )

    # =========================================
    # HALLUCINATION CHECK
    # =========================================
    for danger in DANGEROUS_HALLUCINATIONS:

        if danger in text:

            warnings.append(
                f"Potential hallucinated diagnosis: {danger}"
            )

    return warnings