def detect_emergency(text):

    text = text.lower()

    emergencies = {

        "chest pain":
        "Chest pain can be serious. Please seek emergency medical help immediately.",

        "cannot breathe":
        "Difficulty breathing is an emergency. Call emergency services now.",

        "stroke":
        "Possible stroke detected. Go to the hospital immediately.",

        "severe bleeding":
        "Severe bleeding detected. Apply pressure and seek emergency help immediately.",

        "pregnant bleeding":
        "Bleeding during pregnancy can be dangerous. Please go to the hospital immediately."
    }

    for keyword, warning in emergencies.items():

        if keyword in text:
            return warning

    return None