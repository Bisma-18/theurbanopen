"""
The Urban Open — Full-Stack Backend
Flask + SQLite | CRUD Tournament Registration API
Database Schema: registrations table
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__, static_folder='.')
CORS(app)

DB_PATH = 'tournament.db'

# ─────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    DATABASE SCHEMA:
    Collection/Table: registrations
    Fields:
      - id          INTEGER PRIMARY KEY AUTOINCREMENT
      - player_name TEXT NOT NULL
      - game_id     TEXT NOT NULL
      - team_name   TEXT NOT NULL
      - wallet      TEXT (MetaMask wallet address)
      - payment_method TEXT DEFAULT 'MetaMask'
      - payment_status TEXT DEFAULT 'Paid'
      - tx_hash     TEXT (blockchain transaction hash)
      - registered_at TEXT (ISO datetime)
    """
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS registrations (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name      TEXT NOT NULL,
            game_id          TEXT NOT NULL,
            team_name        TEXT NOT NULL,
            wallet           TEXT,
            payment_method   TEXT DEFAULT 'MetaMask',
            payment_status   TEXT DEFAULT 'Paid',
            tx_hash          TEXT,
            registered_at    TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("✅ Database initialized — tournament.db ready")

# ─────────────────────────────────────────
# SERVE STATIC FILES
# ─────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

# ─────────────────────────────────────────
# CRUD ROUTES
# ─────────────────────────────────────────

# CREATE — Register a new player
@app.route('/api/registrations', methods=['POST'])
def create_registration():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['player_name', 'game_id', 'team_name']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing field: {field}'}), 400

    try:
        conn = get_db()
        # Check slot limit
        count = conn.execute('SELECT COUNT(*) as c FROM registrations').fetchone()['c']
        if count >= 10:
            conn.close()
            return jsonify({'error': 'Tournament is full (10/10 players)'}), 409

        # Check duplicate game_id
        existing = conn.execute('SELECT id FROM registrations WHERE game_id = ?', (data['game_id'],)).fetchone()
        if existing:
            conn.close()
            return jsonify({'error': f"Game ID '{data['game_id']}' is already registered"}), 409

        cursor = conn.execute('''
            INSERT INTO registrations (player_name, game_id, team_name, wallet, payment_method, payment_status, tx_hash, registered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['player_name'],
            data['game_id'],
            data['team_name'],
            data.get('wallet', ''),
            data.get('payment_method', 'MetaMask'),
            data.get('payment_status', 'Paid'),
            data.get('tx_hash', ''),
            datetime.now().isoformat()
        ))
        conn.commit()
        new_id = cursor.lastrowid
        reg = conn.execute('SELECT * FROM registrations WHERE id = ?', (new_id,)).fetchone()
        conn.close()
        return jsonify({'message': 'Registration successful!', 'registration': dict(reg)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# READ ALL — Get all registrations
@app.route('/api/registrations', methods=['GET'])
def get_all_registrations():
    try:
        conn = get_db()
        rows = conn.execute('SELECT * FROM registrations ORDER BY id DESC').fetchall()
        conn.close()
        return jsonify({'registrations': [dict(r) for r in rows], 'total': len(rows)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# READ ONE — Get single registration by id
@app.route('/api/registrations/<int:reg_id>', methods=['GET'])
def get_registration(reg_id):
    try:
        conn = get_db()
        reg = conn.execute('SELECT * FROM registrations WHERE id = ?', (reg_id,)).fetchone()
        conn.close()
        if not reg:
            return jsonify({'error': 'Registration not found'}), 404
        return jsonify({'registration': dict(reg)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# UPDATE — Update registration details
@app.route('/api/registrations/<int:reg_id>', methods=['PUT'])
def update_registration(reg_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    try:
        conn = get_db()
        reg = conn.execute('SELECT * FROM registrations WHERE id = ?', (reg_id,)).fetchone()
        if not reg:
            conn.close()
            return jsonify({'error': 'Registration not found'}), 404

        conn.execute('''
            UPDATE registrations
            SET player_name=?, game_id=?, team_name=?
            WHERE id=?
        ''', (
            data.get('player_name', reg['player_name']),
            data.get('game_id', reg['game_id']),
            data.get('team_name', reg['team_name']),
            reg_id
        ))
        conn.commit()
        updated = conn.execute('SELECT * FROM registrations WHERE id = ?', (reg_id,)).fetchone()
        conn.close()
        return jsonify({'message': 'Registration updated!', 'registration': dict(updated)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# DELETE — Remove a registration
@app.route('/api/registrations/<int:reg_id>', methods=['DELETE'])
def delete_registration(reg_id):
    try:
        conn = get_db()
        reg = conn.execute('SELECT * FROM registrations WHERE id = ?', (reg_id,)).fetchone()
        if not reg:
            conn.close()
            return jsonify({'error': 'Registration not found'}), 404
        conn.execute('DELETE FROM registrations WHERE id = ?', (reg_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': f'Player removed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ADMIN — Stats endpoint
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    try:
        conn = get_db()
        total = conn.execute('SELECT COUNT(*) as c FROM registrations').fetchone()['c']
        paid = conn.execute("SELECT COUNT(*) as c FROM registrations WHERE payment_status='Paid'").fetchone()['c']
        teams = conn.execute('SELECT DISTINCT team_name FROM registrations').fetchall()
        conn.close()
        return jsonify({
            'total_players': total,
            'slots_remaining': 10 - total,
            'paid_count': paid,
            'unique_teams': len(teams)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    print(f"🚀 The Urban Open Backend running on port {port}")
    print("📋 API Endpoints:")
    print("   POST   /api/registrations        — Register player")
    print("   GET    /api/registrations        — Get all registrations")
    print("   GET    /api/registrations/<id>   — Get single registration")
    print("   PUT    /api/registrations/<id>   — Update registration")
    print("   DELETE /api/registrations/<id>   — Delete registration")
    print("   GET    /api/admin/stats          — Admin stats")
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
