import io
import csv
from typing import List, Dict, Any

FORMULA_TRIGGERS = ('=', '+', '-', '@', '\t', '\r')

def sanitize_csv_cell(value: Any) -> str:
    if value is None:
        return ""
    val_str = str(value)
    # Prepend apostrophe if cell begins with formula trigger character
    if val_str.startswith(FORMULA_TRIGGERS):
        return f"'{val_str}"
    return val_str

def generate_csv_report(rows: List[Dict[str, Any]], fieldnames: List[str]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator='\r\n')
    writer.writeheader()
    
    for row in rows:
        sanitized_row = {k: sanitize_csv_cell(row.get(k, "")) for k in fieldnames}
        writer.writerow(sanitized_row)
        
    return output.getvalue()
