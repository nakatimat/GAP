from flask import Flask, render_template, jsonify, request, send_file
from src import database as db
from src import excel_exporter as exp
import os

app = Flask(__name__, static_folder='public', static_url_path='/static')

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Initialize DB
db.init_db()
db.seed_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats')
def get_stats():
    return jsonify(db.get_dashboard_stats())

@app.route('/api/assets', methods=['GET', 'POST'])
def handle_assets():
    if request.method == 'POST':
        data = request.json
        success, msg = db.create_asset(
            data.get('code'), 
            data.get('item_type'), 
            data.get('description'), 
            data.get('acquisition_date')
        )
        return jsonify({"success": success, "message": msg})
    
    df = db.get_all_assets_df()
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/assets/<int:asset_id>', methods=['DELETE', 'PUT'])
def handle_single_asset(asset_id):
    if request.method == 'DELETE':
        # Need to implement a delete_asset in database.py or use a workaround
        # For now, let's assume we can release it or we'll add delete later
        return jsonify({"success": False, "message": "Delete not implemented yet"})
    return jsonify({"success": False, "message": "Method not allowed"})

@app.route('/api/employees', methods=['GET', 'POST'])
def handle_employees():
    if request.method == 'POST':
        data = request.json
        success, msg = db.create_employee(
            data.get('name'),
            data.get('desk_number'),
            data.get('location'),
            data.get('possession_date')
        )
        return jsonify({"success": success, "message": msg})
    
    return jsonify(db.get_all_employees())

@app.route('/api/employees/<int:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    success, msg = db.delete_employee(emp_id)
    return jsonify({"success": success, "message": msg})

@app.route('/api/employees/<int:emp_id>/assets')
def get_employee_assets(emp_id):
    return jsonify(db.get_employee_assets(emp_id))

@app.route('/api/assets/available')
def get_available_assets():
    return jsonify(db.get_available_assets())

@app.route('/api/assignments', methods=['POST'])
def assign_asset():
    data = request.json
    success, msg = db.assign_asset(data.get('asset_id'), data.get('employee_id'))
    return jsonify({"success": success, "message": msg})

@app.route('/api/assignments/release', methods=['POST'])
def release_asset():
    data = request.json
    success, msg = db.release_asset(data.get('asset_id'))
    return jsonify({"success": success, "message": msg})

@app.route('/api/search')
def search():
    query = request.args.get('q', '')
    df = db.get_unified_search_df(query)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/export')
def export_excel():
    excel_data = exp.generate_excel_report()
    # Save to a temp file and send
    temp_path = "GAP_Report_Temp.xlsx"
    with open(temp_path, "wb") as f:
        f.write(excel_data.getvalue())
    return send_file(temp_path, as_attachment=True, download_name="GAP_Ativos.xlsx")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
