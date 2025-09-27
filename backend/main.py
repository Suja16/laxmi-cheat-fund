from flask import Flask, jsonify
import os
import sys
from flask_cors import CORS


app = Flask(__name__)

CORS(app)

@app.route('/')
def default():
    return jsonify("tmkc")


# app.register_blueprint("")

if __name__ == "__main__":
    app.run(debug=True, host = '0.0.0.0', port=2522)