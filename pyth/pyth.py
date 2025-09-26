import requests
import sseclient
import json

def get_price_feed_id():
    with open('d:/systum/laxmi-cheat-fund-1/pyth/ids.txt', 'r') as f:
        for line in f:
            if 'ETH_USD_STABLE' in line:
                return line.split('=')[1].strip().strip("'")

def get_latest_price_update(price_feed_id):
    url = f'https://hermes.pyth.network/v2/updates/price/latest?ids[]={price_feed_id}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        parsed_data = data.get('parsed', [])
        if parsed_data:
            for item in parsed_data:
                price_info = item.get('price', {})
                if price_info:
                    price = int(price_info.get('price', 0))
                    expo = int(price_info.get('expo', 0))
                    real_price = price * (10 ** expo)
                    print(f"Latest Price: {real_price}, Publish Time: {price_info.get('publish_time')}")
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to REST endpoint: {e}")

def stream_price_updates(price_feed_id):
    url = f'https://hermes.pyth.network/v2/updates/price/stream?ids[]={price_feed_id}'
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status() 
        
        client = sseclient.SSEClient(response)
        
        for event in client.events():
            if event.event == 'message':
                try:
                    data = json.loads(event.data)
                    parsed_data = data.get('parsed', [])
                    if parsed_data:
                        for item in parsed_data:
                            price_info = item.get('price', {})
                            if price_info:
                                price = int(price_info.get('price', 0))
                                expo = int(price_info.get('expo', 0))
                                real_price = price * (10 ** expo)
                                print(f"Price: {real_price}, Publish Time: {price_info.get('publish_time')}")
                except json.JSONDecodeError:
                    print(f"Failed to decode JSON from data: {event.data}")
                except Exception as e:
                    print(f"An error occurred while processing event data: {e}")

    except requests.exceptions.RequestException as e:
        print(f"Error connecting to streaming endpoint: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    price_id = get_price_feed_id()
    if price_id:
        print("--- Fetching latest price update via REST API ---")
        get_latest_price_update(price_id)
        print("\n--- Starting to stream price updates ---")
        stream_price_updates(price_id)
    else:
        print("Could not find ETH_USD_STABLE price feed ID.")
