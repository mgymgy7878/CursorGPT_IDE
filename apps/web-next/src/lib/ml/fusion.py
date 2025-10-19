"""
ML Signal Fusion - Python Reference Implementation
For training/backtesting (offline analysis)

Usage:
  from ml.fusion import sanitize, fuse, decide
  
  row = {...}  # FeatureRow dict
  clean = sanitize(row)
  if clean:
    score, parts = fuse(clean)
    decision, confid = decide(score)
"""

import numpy as np
from typing import Dict, Optional, Tuple, Literal

def sanitize(row: Dict) -> Optional[Dict]:
    """
    Validate feature row - reject NaN/Infinity
    
    Args:
        row: FeatureRow dict with OHLCV + indicators
        
    Returns:
        Cleaned row or None if invalid
    """
    # Check required OHLCV
    required = ["o", "h", "l", "c", "v"]
    for k in required:
        if k not in row or row[k] is None:
            return None
        if not np.isfinite(row[k]):
            return None
    
    # Check all numeric values are finite
    for k, v in row.items():
        if isinstance(v, (int, float)) and not np.isfinite(v):
            return None
    
    return row

def fuse(row: Dict) -> Tuple[float, Dict[str, float]]:
    """
    Fuse signals - weighted ensemble
    
    Args:
        row: Cleaned FeatureRow
        
    Returns:
        (score, parts) where score in [-1, 1]
    """
    parts = {}
    
    # RSI (mean-revert)
    if "rsi_14" in row and row["rsi_14"] is not None:
        parts["rsi"] = (50 - row["rsi_14"]) / 50
    
    # MACD histogram (momentum)
    if "macd_hist" in row and row["macd_hist"] is not None:
        parts["macd"] = np.tanh(row["macd_hist"])
    
    # EMA trend (crossover)
    if row.get("ema_20") and row.get("ema_50") and row.get("c", 0) > 0:
        parts["trend"] = np.tanh((row["ema_20"] - row["ema_50"]) / row["c"])
    
    # ATR volatility filter
    if row.get("atr_14") and row.get("c", 0) > 0:
        atr_pct = row["atr_14"] / row["c"]
        parts["vol"] = 0 if atr_pct > 0.05 else 1
    
    # Weighted average
    weights = {"rsi": 0.3, "macd": 0.4, "trend": 0.3}
    total_weight = sum(weights.get(k, 0) for k in parts.keys())
    
    if total_weight > 0:
        score = sum(parts.get(k, 0) * weights.get(k, 0) for k in parts.keys()) / total_weight
        score = max(-1, min(1, score))
    else:
        score = 0.0
    
    return score, parts

def decide(score: float, confid_floor: float = 0.55) -> Tuple[Literal[-1, 0, 1], float]:
    """
    Convert score to discrete decision
    
    Args:
        score: Continuous score in [-1, 1]
        confid_floor: Minimum confidence threshold
        
    Returns:
        (decision, confidence) where decision in {-1, 0, 1}
    """
    abs_score = abs(score)
    confid = max(0.0, min(1.0, abs_score))
    
    # Below confidence floor → flat
    if abs_score < confid_floor:
        return 0, confid
    
    # Above floor → directional
    decision = 1 if score > 0 else -1
    return decision, confid

# Example usage
if __name__ == "__main__":
    # Sample feature row
    row = {
        "ts": 1697241600000,
        "symbol": "BTCUSDT",
        "tf": "1h",
        "o": 27500, "h": 27650, "l": 27450, "c": 27600, "v": 1200,
        "rsi_14": 45.5,
        "macd_hist": 0.25,
        "ema_20": 27550,
        "ema_50": 27400,
        "atr_14": 150
    }
    
    clean = sanitize(row)
    if clean:
        score, parts = fuse(clean)
        decision, confid = decide(score)
        
        print(f"Score: {score:.3f}")
        print(f"Parts: {parts}")
        print(f"Decision: {decision} (confid: {confid:.3f})")
    else:
        print("Invalid row (NaN/Infinity)")

