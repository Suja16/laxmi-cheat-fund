# How to Consume the Pyth Price Feed

This document provides instructions on how to integrate the Pyth price feed into your trading algorithm.

## 1. Prerequisites

Before you can use the price feed, you need to install the necessary Python packages. These are listed in the `requirements.txt` file.

To install them, run the following command in your terminal:

```bash
pip install -r requirements.txt
```

## 2. Configuration

The `ids.txt` file contains the unique identifiers for the price feeds you want to use. You can find a complete list of available price feed IDs on the [Pyth Network documentation website](https://docs.pyth.network/price-feeds/price-feeds).

To use a specific price feed, add it to the `ids.txt` file in the following format:

```
ASSET_NAME='<price_feed_id>'
```

For example:
```
ETH_USD_STABLE='0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
```

The `pyth.py` script is currently configured to use the `ETH_USD_STABLE` price feed. You can modify the `get_price_feed_id` function in `pyth.py` to use a different ID from `ids.txt`.

## 3. Using the Price Feed in Your Algorithm

The `pyth.py` script provides two main functions for fetching price data:

*   `get_latest_price_update(price_feed_id)`: Fetches the latest price update via a REST API call.
*   `stream_price_updates(price_feed_id)`: Establishes a streaming connection to receive real-time price updates.

You can import these functions into your trading algorithm and use them to get the price data you need.

### Example Usage

Here is an example of how you might use these functions in your own Python script:

```python
from pyth import get_price_feed_id, get_latest_price_update, stream_price_updates

def run_trading_algorithm():
    # Get the price feed ID from ids.txt
    price_id = get_price_feed_id()

    if not price_id:
        print("Could not find the specified price feed ID.")
        return

    # Get the latest price before starting the stream
    print("--- Fetching initial price ---")
    get_latest_price_update(price_id)

    # Start streaming prices for real-time data
    print("\n--- Starting real-time price stream for trading ---")
    # You can integrate the streaming function into your algorithm's main loop
    # For this example, we'll just call it directly.
    # In a real algorithm, you might want to run this in a separate thread
    # or use asynchronous programming.
    stream_price_updates(price_id)


if __name__ == "__main__":
    run_trading_algorithm()
```

This example shows how to import the functions from `pyth.py` and use them to fetch and stream price data. You can adapt this to fit the structure of your trading algorithm. For instance, you could run the `stream_price_updates` function in a background thread and have it update a shared variable that your main trading logic can access.
