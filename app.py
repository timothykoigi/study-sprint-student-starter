from flask import Flask, jsonify, request, send_from_directory, session, make_response

app = Flask(__name__, static_folder="static")

app.config["SECRET_KEY"] = "change-this-secret-key-for-class-demo"

study_sessions = [
    {
        "id": 1,
        "topic": "Understand GET requests",
        "minutes": 25,
        "completed": False
    },
    {
        "id": 2,
        "topic": "Practice Flask routes",
        "minutes": 30,
        "completed": False
    }
]


def find_study_session(session_id):
    for item in study_sessions:
        if item["id"] == session_id:
            return item
    return None


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/study-sessions", methods=["GET"])
def get_study_sessions():
    return jsonify(study_sessions), 200


@app.route("/api/me", methods=["GET"])
def get_me():
    visits = session.get("visits", 0)
    visits += 1
    session["visits"] = visits

    username = session.get("username")
    focus_mode = request.cookies.get("focus_mode", "standard")

    return jsonify({
        "username": username,
        "visits": visits,
        "focus_mode": focus_mode
    }), 200


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()

    if not username:
        return jsonify({
            "error": "Username is required."
        }), 400

    session["username"] = username
    session["visits"] = 0

    return jsonify({
        "message": "Login successful",
        "username": username
    }), 201


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Session cleared. You are logged out."
    }), 200


@app.route("/api/study-sessions", methods=["POST"])
def create_study_session():
    data = request.get_json(silent=True) or {}

    topic = str(data.get("topic", "")).strip()

    if not topic:
        return jsonify({
            "error": "Topic is required."
        }), 400

    try:
        minutes = int(data.get("minutes"))
    except (TypeError, ValueError):
        return jsonify({
            "error": "Minutes must be a number."
        }), 400

    new_id = max(
        (item["id"] for item in study_sessions),
        default=0
    ) + 1

    new_session = {
        "id": new_id,
        "topic": topic,
        "minutes": minutes,
        "completed": False
    }

    study_sessions.append(new_session)

    return jsonify(new_session), 201


@app.route("/api/study-sessions/<int:session_id>", methods=["PATCH"])
def complete_study_session(session_id):
    study_session = find_study_session(session_id)

    if study_session is None:
        return jsonify({
            "error": "Study session not found."
        }), 404

    study_session["completed"] = True

    return jsonify(study_session), 200


@app.route("/api/study-sessions/<int:session_id>", methods=["DELETE"])
def delete_study_session(session_id):
    study_session = find_study_session(session_id)

    if study_session is None:
        return jsonify({
            "error": "Study session not found."
        }), 404

    study_sessions.remove(study_session)

    return jsonify({
        "message": "Study session deleted.",
        "deleted": study_session
    }), 200


@app.route("/api/focus-mode", methods=["POST"])
def set_focus_mode():
    data = request.get_json(silent=True) or {}
    mode = str(data.get("mode", "")).strip().lower()

    allowed_modes = {
        "standard",
        "deep",
        "revision",
        "practice"
    }

    if mode not in allowed_modes:
        return jsonify({
            "error": "Invalid focus mode."
        }), 400

    response = make_response(
        jsonify({
            "message": "Focus mode saved.",
            "focus_mode": mode
        }),
        200
    )

    seven_days = 60 * 60 * 24 * 7

    response.set_cookie(
        "focus_mode",
        mode,
        max_age=seven_days,
        samesite="Lax"
    )

    return response


if __name__ == "__main__":
    app.run(debug=True, port=5000)