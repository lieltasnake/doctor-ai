class PatientState:
    def __init__(self):
        self.messages = []
        self.symptoms = []
        self.timeline = []
        self.risk = "unknown"

    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})

    def add_symptom(self, symptom):
        if symptom not in self.symptoms:
            self.symptoms.append(symptom)

    def update_timeline(self, event):
        self.timeline.append(event)