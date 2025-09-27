from flask import Flask, jsonify, Response
import os
import sys
from flask_cors import CORS


app = Flask(__name__)

CORS(app)

@app.route('/')
def default():
    return jsonify("tmkc")


import docker
import json
def getPrices():
    client = docker.from_env()  
    container = client.containers.get("pyth-price-pusher-1")
    log_stream = container.logs(stream=True, follow=True)
    
    for raw_line in log_stream:
        try:
            log = json.loads(raw_line.decode("utf-8").strip())
            if log.get("module") == "Controller":
                src_price = int(log["sourcePrice"]["price"]) / 1e8
                tgt_price = int(log["targetPrice"]["price"]) / 1e8
                frame = {
                    "time": log["time"],
                    "symbol": log["symbol"],
                    "src_price": src_price,
                    "tgt_price": tgt_price,
                }
                yield f"data: {json.dumps(frame)}\n\n"
        except Exception as e:
            continue

@app.route("/get_prices")
def stream_prices():
    return Response(getPrices(), content_type='text/event-stream')




if __name__ == "__main__":
    app.run(debug=True, host = '0.0.0.0', port=2522)