import psycopg2

conn = psycopg2.connect(
    dbname="ai_doctor",
    user="postgres",
    password="your_password",
    host="localhost",
    port="5432"
)

def save_message(session_id, message):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO patient_memory (session_id, message) VALUES (%s, %s)",
        (session_id, message)
    )
    conn.commit()


def get_history(session_id):
    cur = conn.cursor()
    cur.execute(
        "SELECT message FROM patient_memory WHERE session_id=%s ORDER BY id ASC",
        (session_id,)
    )
    return [{"role": "user", "content": row[0]} for row in cur.fetchall()]