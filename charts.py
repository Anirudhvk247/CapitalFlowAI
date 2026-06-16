import database
from datetime import datetime, timedelta

def get_daily_charts(date_str):
    """
    Generates data for Chart.js rendering for a specific day.
    Includes:
    - Today's Equities % Change (Bar Chart)
    - Today's Commodities % Change (Bar Chart)
    - Today's Cryptos & Indicators % Change (Bar Chart)
    - Today's Institutional Flow (FII vs DII vs Total)
    - 7-Day Trend of Total Net Flow (Line Chart)
    - 7-Day Trend of Key Indices (Line Chart)
    """
    # 1. Fetch today's market data
    market_data = database.get_market_data_by_date(date_str)
    flow_data = database.get_fii_dii_flow_by_date(date_str)
    
    # Categorize indices
    equities = []
    commodities = []
    others = []
    
    eq_names = {"NIFTY 50", "Nifty 50", "S&P 500", "NASDAQ", "Shanghai Composite", "Nikkei 225", "TAIEX", "FTSE 100", "CAC 40", "STOXX Europe 600"}
    cmd_names = {"Gold", "Silver", "Copper", "Brent Crude", "Brent Crude Oil"}
    
    for item in market_data:
        name = item['index_name']
        val = {
            "name": name,
            "change": item['percent_change'],
            "price": item['price']
        }
        if name in eq_names:
            equities.append(val)
        elif name in cmd_names:
            commodities.append(val)
        else:
            others.append(val)
            
    # Format Equities Bar Chart
    eq_chart = {
        "labels": [e["name"] for e in equities],
        "datasets": [{
            "label": "Equity Market % Change",
            "data": [e["change"] for e in equities],
            "backgroundColor": ["rgba(52, 211, 153, 0.6)" if e["change"] >= 0 else "rgba(248, 113, 113, 0.6)" for e in equities],
            "borderColor": ["rgba(52, 211, 153, 1)" if e["change"] >= 0 else "rgba(248, 113, 113, 1)" for e in equities],
            "borderWidth": 1
        }]
    }
    
    # Format Commodities Bar Chart
    cmd_chart = {
        "labels": [c["name"] for c in commodities],
        "datasets": [{
            "label": "Commodities % Change",
            "data": [c["change"] for c in commodities],
            "backgroundColor": ["rgba(251, 191, 36, 0.6)" if c["change"] >= 0 else "rgba(248, 113, 113, 0.6)" for c in commodities],
            "borderColor": ["rgba(251, 191, 36, 1)" if c["change"] >= 0 else "rgba(248, 113, 113, 1)" for c in commodities],
            "borderWidth": 1
        }]
    }
    
    # Format Others Bar Chart (Bitcoin, Ethereum, VIX, DXY, etc.)
    oth_chart = {
        "labels": [o["name"] for o in others],
        "datasets": [{
            "label": "Risk & Crypto % Change",
            "data": [o["change"] for o in others],
            "backgroundColor": ["rgba(99, 102, 241, 0.6)" if o["change"] >= 0 else "rgba(248, 113, 113, 0.6)" for o in others],
            "borderColor": ["rgba(99, 102, 241, 1)" if o["change"] >= 0 else "rgba(248, 113, 113, 1)" for o in others],
            "borderWidth": 1
        }]
    }
    
    # Format Today's Institutional Flow Chart
    flow_chart = None
    if flow_data:
        flow_chart = {
            "labels": ["FII Net Flow", "DII Net Flow", "Total Net Flow"],
            "datasets": [{
                "label": "Net Flow (Cr)",
                "data": [flow_data["fii_netflow"], flow_data["dii_netflow"], flow_data["total_netflow"]],
                "backgroundColor": [
                    "rgba(52, 211, 153, 0.6)" if flow_data["fii_netflow"] >= 0 else "rgba(248, 113, 113, 0.6)",
                    "rgba(52, 211, 153, 0.6)" if flow_data["dii_netflow"] >= 0 else "rgba(248, 113, 113, 0.6)",
                    "rgba(99, 102, 241, 0.6)" if flow_data["total_netflow"] >= 0 else "rgba(248, 113, 113, 0.6)"
                ],
                "borderColor": [
                    "rgba(52, 211, 153, 1)" if flow_data["fii_netflow"] >= 0 else "rgba(248, 113, 113, 1)",
                    "rgba(52, 211, 153, 1)" if flow_data["dii_netflow"] >= 0 else "rgba(248, 113, 113, 1)",
                    "rgba(99, 102, 241, 1)" if flow_data["total_netflow"] >= 0 else "rgba(248, 113, 113, 1)"
                ],
                "borderWidth": 1
            }]
        }
        
    # Historical 7-day Trend leading up to 'date'
    # Parse target date
    try:
        end_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        end_date = datetime.now()
        
    trend_labels = []
    trend_fii_dii = []
    trend_nifty = []
    trend_spx = []
    
    # Query database for last 7 dates
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        # Fetch flows
        cursor.execute('''
            SELECT date, fii_netflow, dii_netflow, total_netflow 
            FROM fii_dii_flow 
            WHERE date <= %s 
            ORDER BY date DESC LIMIT 7
        ''', (date_str,))
        flow_rows = list(cursor.fetchall())
        flow_rows.reverse() # chronologically ascending
        
        trend_labels = [row['date'] for row in flow_rows]
        
        # Build line datasets
        fii_data = [row['fii_netflow'] for row in flow_rows]
        dii_data = [row['dii_netflow'] for row in flow_rows]
        total_data = [row['total_netflow'] for row in flow_rows]
        
        flow_trend = {
            "labels": trend_labels,
            "datasets": [
                {
                    "label": "FII Net",
                    "data": fii_data,
                    "borderColor": "rgba(248, 113, 113, 1)",
                    "backgroundColor": "rgba(248, 113, 113, 0.1)",
                    "fill": False,
                    "tension": 0.2
                },
                {
                    "label": "DII Net",
                    "data": dii_data,
                    "borderColor": "rgba(52, 211, 153, 1)",
                    "backgroundColor": "rgba(52, 211, 153, 0.1)",
                    "fill": False,
                    "tension": 0.2
                },
                {
                    "label": "Total Net",
                    "data": total_data,
                    "borderColor": "rgba(99, 102, 241, 1)",
                    "backgroundColor": "rgba(99, 102, 241, 0.2)",
                    "fill": True,
                    "tension": 0.2
                }
            ]
        }
        
        # NIFTY & SPX Price trends
        nifty_prices = []
        spx_prices = []
        for d in trend_labels:
            cursor.execute("SELECT price FROM market_data WHERE date = %s AND index_name LIKE '%%NIFTY%%'", (d,))
            r = cursor.fetchone()
            nifty_prices.append(r['price'] if r else None)
            
            cursor.execute("SELECT price FROM market_data WHERE date = %s AND index_name LIKE '%%S&P 500%%'", (d,))
            r = cursor.fetchone()
            spx_prices.append(r['price'] if r else None)
            
        index_trend = {
            "labels": trend_labels,
            "datasets": [
                {
                    "label": "NIFTY 50",
                    "data": nifty_prices,
                    "borderColor": "rgba(52, 211, 153, 1)",
                    "yAxisID": "yNifty",
                    "fill": False,
                    "tension": 0.2
                },
                {
                    "label": "S&P 500",
                    "data": spx_prices,
                    "borderColor": "rgba(99, 102, 241, 1)",
                    "yAxisID": "ySpx",
                    "fill": False,
                    "tension": 0.2
                }
            ]
        }
        
    finally:
        conn.close()
        
    return {
        "equities": eq_chart,
        "commodities": cmd_chart,
        "others": oth_chart,
        "flows": flow_chart,
        "flow_trend": flow_trend if trend_labels else None,
        "index_trend": index_trend if trend_labels else None
    }

def get_monthly_charts(month, year):
    """
    Generates historical line chart configurations for an entire month.
    Includes:
    - Daily index movements (NIFTY, S&P 500, Gold, Bitcoin) over the month.
    - Daily FII/DII flow trends over the month.
    """
    market_rows = database.get_market_data_for_month(month, year)
    flow_rows = database.get_fii_dii_flow_for_month(month, year)
    
    # Group dates and values
    dates = sorted(list(set(row['date'] for row in flow_rows)))
    if not dates and market_rows:
        dates = sorted(list(set(row['date'] for row in market_rows)))
        
    # Flow Trends
    fii_data = []
    dii_data = []
    total_data = []
    for d in dates:
        # Find matching flow row
        matching = next((f for f in flow_rows if f['date'] == d), None)
        if matching:
            fii_data.append(matching['fii_netflow'])
            dii_data.append(matching['dii_netflow'])
            total_data.append(matching['total_netflow'])
        else:
            fii_data.append(0.0)
            dii_data.append(0.0)
            total_data.append(0.0)
            
    flow_trend = {
        "labels": dates,
        "datasets": [
            {
                "label": "FII Net Flow",
                "data": fii_data,
                "borderColor": "rgba(248, 113, 113, 1)",
                "backgroundColor": "rgba(248, 113, 113, 0.1)",
                "fill": False,
                "tension": 0.2
            },
            {
                "label": "DII Net Flow",
                "data": dii_data,
                "borderColor": "rgba(52, 211, 153, 1)",
                "backgroundColor": "rgba(52, 211, 153, 0.1)",
                "fill": False,
                "tension": 0.2
            },
            {
                "label": "Total Net Flow",
                "data": total_data,
                "borderColor": "rgba(99, 102, 241, 1)",
                "backgroundColor": "rgba(99, 102, 241, 0.2)",
                "fill": True,
                "tension": 0.2
            }
        ]
    }
    
    # Key asset prices over the month
    nifty_prices = []
    spx_prices = []
    gold_prices = []
    btc_prices = []
    
    for d in dates:
        # Filter market rows for date
        day_rows = [r for r in market_rows if r['date'] == d]
        
        n_p = next((r['price'] for r in day_rows if 'NIFTY' in r['index_name']), None)
        s_p = next((r['price'] for r in day_rows if 'S&P 500' in r['index_name']), None)
        g_p = next((r['price'] for r in day_rows if 'Gold' in r['index_name']), None)
        b_p = next((r['price'] for r in day_rows if 'Bitcoin' in r['index_name']), None)
        
        nifty_prices.append(n_p)
        spx_prices.append(s_p)
        gold_prices.append(g_p)
        btc_prices.append(b_p)
        
    assets_trend = {
        "labels": dates,
        "datasets": [
            {
                "label": "NIFTY 50",
                "data": nifty_prices,
                "borderColor": "rgba(52, 211, 153, 1)",
                "fill": False,
                "tension": 0.2,
                "yAxisID": "yNifty"
            },
            {
                "label": "S&P 500",
                "data": spx_prices,
                "borderColor": "rgba(99, 102, 241, 1)",
                "fill": False,
                "tension": 0.2,
                "yAxisID": "ySpx"
            },
            {
                "label": "Gold",
                "data": gold_prices,
                "borderColor": "rgba(251, 191, 36, 1)",
                "fill": False,
                "tension": 0.2,
                "yAxisID": "yGold"
            },
            {
                "label": "Bitcoin",
                "data": btc_prices,
                "borderColor": "rgba(239, 68, 68, 1)",
                "fill": False,
                "tension": 0.2,
                "yAxisID": "yBtc"
            }
        ]
    }
    
    return {
        "flows": flow_trend,
        "assets": assets_trend
    }

def get_all_assets_history(date_str, days=15):
    """
    Retrieves the historical prices/values for all 21 items over the last 'days' days.
    Returns:
        dict: {
            "dates": [date1, date2, ...],
            "assets": {
                "NIFTY 50": [price1, price2, ...],
                ...
                "FII Net Flow": [flow1, flow2, ...],
                "DII Net Flow": [flow1, flow2, ...],
                "Total Net Flow": [flow1, flow2, ...]
            }
        }
    """
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Fetch the last 'days' dates chronologically up to date_str
        cursor.execute('''
            SELECT date, fii_netflow, dii_netflow, total_netflow
            FROM fii_dii_flow
            WHERE date <= %s
            ORDER BY date DESC LIMIT %s
        ''', (date_str, days))
        flow_rows = list(cursor.fetchall())
        flow_rows.reverse() # chronologically ascending
        
        dates = [row['date'] for row in flow_rows]
        if not dates:
            return {"dates": [], "assets": {}}
            
        assets_history = {}
        
        # Identify all index names dynamically
        cursor.execute('SELECT DISTINCT index_name FROM market_data')
        names = cursor.fetchall()
        for r in names:
            assets_history[r['index_name']] = [None] * len(dates)
            
        # Add FII/DII Net Flows
        assets_history["FII Net Flow"] = [0.0] * len(dates)
        assets_history["DII Net Flow"] = [0.0] * len(dates)
        assets_history["Total Net Flow"] = [0.0] * len(dates)
        
        # Populate values day-by-day
        for idx, date_val in enumerate(dates):
            # Market data
            cursor.execute('SELECT index_name, price FROM market_data WHERE date = %s', (date_val,))
            market_rows = cursor.fetchall()
            for r in market_rows:
                name = r['index_name']
                if name in assets_history:
                    assets_history[name][idx] = r['price']
                    
            # Flow data
            matching_flow = next((f for f in flow_rows if f['date'] == date_val), None)
            if matching_flow:
                assets_history["FII Net Flow"][idx] = matching_flow["fii_netflow"]
                assets_history["DII Net Flow"][idx] = matching_flow["dii_netflow"]
                assets_history["Total Net Flow"][idx] = matching_flow["total_netflow"]
                
        return {
            "dates": dates,
            "assets": assets_history
        }
    finally:
        conn.close()

