from flask import Flask, jsonify, Response, request
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

# @app.route('/start-twap', methods=['POST'])
# def start_twap():
#     try:
#         data = request.get_json()
        
#         # Validate required fields
#         required_fields = ['fromToken', 'toToken', 'totalAmount', 'numberOfOrders', 
#                           'intervalMinutes', 'executionWindow', 'slippageTolerance', 'userAddress']
        
#         for field in required_fields:
#             if field not in data:
#                 return jsonify({'error': f'Missing required field: {field}'}), 400
        
#         # Here you would typically integrate with your smart contract or trading logic
#         # For now, we'll just return a success response
#         response = {
#             'success': True,
#             'message': 'TWAP trading strategy started successfully',
#             'data': {
#                 'fromToken': data['fromToken'],
#                 'toToken': data['toToken'],
#                 'totalAmount': data['totalAmount'],
#                 'numberOfOrders': data['numberOfOrders'],
#                 'intervalMinutes': data['intervalMinutes'],
#                 'executionWindow': data['executionWindow'],
#                 'slippageTolerance': data['slippageTolerance'],
#                 'userAddress': data['userAddress']
#             }
#         }
        
#         return jsonify(response), 200
        
#     except Exception as e:
#         return jsonify({'error': f'Failed to start TWAP trading: {str(e)}'}), 500




if __name__ == "__main__":
    app.run(debug=True, host = '0.0.0.0', port=2522)