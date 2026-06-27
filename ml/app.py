import pandas as pd
from flask import Flask, request, jsonify
from joblib import load

app = Flask(__name__)

# Charger le modèle et les colonnes d’entraînement avec joblib
model = load("recommendation_model.pkl")
training_columns = load("training_columns.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data or "features" not in data:
        return jsonify({"error": "Missing 'features' in request body"}), 400

    features = data["features"]
    df = pd.DataFrame([features])

    # Colonnes catégorielles possibles
    possible_categorical = [
        "age", "education", "mastery", "competence",
        "time_available", "connection_level", "device_type",
        "battery_level", "time_of_day"
    ]

    # Ne garder que celles présentes dans les données reçues
    categorical_cols = [c for c in possible_categorical if c in df.columns]

    if categorical_cols:
        df = pd.get_dummies(df, columns=categorical_cols)

    # Aligner avec les colonnes d’entraînement
    for col in training_columns:
        if col not in df.columns:
            df[col] = 0
    df = df[training_columns]

    prediction = model.predict(df)
    result = prediction.tolist() if hasattr(prediction, "tolist") else list(prediction)
    return jsonify({"recommendations": result})

if __name__ == "__main__":
    app.run(port=5001, debug=True)