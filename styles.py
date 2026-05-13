import streamlit as st

def get_custom_css():
    """
    Returns premium custom CSS code.
    Fixed in a highly professional Slate Light/Gray theme to avoid white blinding glare.
    """
    # Premium Slate Light / Soft Gray Theme
    bg_color = "#F1F5F9"
    sidebar_bg = "#FFFFFF"
    text_color = "#1E293B"
    subtext_color = "#64748B"
    card_bg = "#FFFFFF"
    card_border = "#E2E8F0"
    accent_blue = "#2563EB"
    accent_blue_hover = "#1D4ED8"
    accent_cyan = "#0D9488"
    metric_bg = "#FFFFFF"
    metric_border = "#E2E8F0"
    glow_shadow = "rgba(100, 116, 139, 0.08)"
    header_gradient = "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)"
    
    # Table (st.data_editor) colors
    gdg_bg_cell = "#FFFFFF"
    gdg_bg_header = "#F8FAFC"
    gdg_text_dark = "#1E293B"
    gdg_text_medium = "#64748B"
    gdg_border_color = "#E2E8F0"

    return f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    /* Global Streamlit Theme Variables */
    :root {{
        --primary-color: {accent_blue};
        --background-color: {bg_color};
        --secondary-background-color: {sidebar_bg};
        --text-color: {text_color};
        --subtext-color: {subtext_color};
        --card-bg: {card_bg};
        --card-border: {card_border};
    }}
    
    /* Header Bar Background Match */
    header[data-testid="stHeader"], .stHeader, [data-testid="stHeader"] > div {{
        background: {bg_color} !important;
        background-color: {bg_color} !important;
    }}
    
    /* Glide Data Grid (st.data_editor) Theme Overrides */
    div.stDataFrameGlideDataEditor, [data-testid="stDataFrameGlideDataEditor"] {{
        --gdg-bg-cell: {gdg_bg_cell} !important;
        --gdg-bg-header: {gdg_bg_header} !important;
        --gdg-text-dark: {gdg_text_dark} !important;
        --gdg-text-medium: {gdg_text_medium} !important;
        --gdg-border-color: {gdg_border_color} !important;
    }}
    
    /* Global Styles */
    html, body, [data-testid="stAppViewContainer"], .stApp {{
        font-family: 'Outfit', sans-serif !important;
        background-color: {bg_color} !important;
        color: {text_color} !important;
    }}
    
    /* Sidebar Styles */
    [data-testid="stSidebar"] {{
        background-color: {sidebar_bg} !important;
        border-right: 1px solid {card_border} !important;
    }}
    
    /* Typography Overrides (Font only) */
    h1, h2, h3, h4, h5, h6, p, span, label {{
        font-family: 'Outfit', sans-serif !important;
    }}
    
    /* Custom Header Design */
    .section-header {{
        font-size: 1.8rem;
        font-weight: 700;
        background: {header_gradient};
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1.25rem;
        margin-top: 0.5rem;
        border-left: 5px solid {accent_blue};
        padding-left: 10px;
    }}
    
    /* Glassmorphic Metric Cards */
    .metric-card {{
        background: {metric_bg};
        border: 1px solid {metric_border};
        box-shadow: 0 4px 12px {glow_shadow};
        border-radius: 14px;
        padding: 1.25rem;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }}
    .metric-card:hover {{
        transform: translateY(-4px);
        box-shadow: 0 8px 20px {glow_shadow};
    }}
    .metric-label {{
        font-size: 0.95rem;
        color: {subtext_color};
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
        font-weight: 500;
    }}
    .metric-value {{
        font-size: 2rem;
        font-weight: 700;
        color: {text_color};
    }}
    .metric-subtext {{
        font-size: 0.8rem;
        color: {accent_cyan};
        font-weight: 600;
        margin-top: 0.25rem;
    }}
    
    /* Info Cards / Containers */
    .info-card {{
        background: {card_bg};
        border: 1px solid {card_border};
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px {glow_shadow};
    }}
    
    /* Streamlit widgets modifications */
    div.stButton > button {{
        background-color: {accent_blue} !important;
        color: #FFFFFF !important;
        font-family: 'Outfit', sans-serif !important;
        font-weight: 600 !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 0.5rem 1.25rem !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 8px {glow_shadow} !important;
    }}
    div.stButton > button:hover {{
        background-color: {accent_blue_hover} !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px {glow_shadow} !important;
    }}
    
    /* Secondary/Reset style button wrapper */
    .secondary-btn div.stButton > button {{
        background: transparent !important;
        color: {text_color} !important;
        border: 1px solid {accent_blue} !important;
    }}
    .secondary-btn div.stButton > button:hover {{
        background: {accent_blue} !important;
        color: #FFFFFF !important;
    }}
    
    /* Form labels & select inputs styling */
    div[data-testid="stForm"] {{
        background: {card_bg} !important;
        border: 1px solid {card_border} !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 12px {glow_shadow} !important;
    }}
    
    /* Sidebar Branding Card */
    .sidebar-brand-card {{
        background: {card_bg};
        border: 1px solid {card_border};
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        margin-bottom: 1.5rem;
    }}
    .sidebar-brand-title {{
        font-weight: 700;
        font-size: 1.2rem;
        color: {text_color};
        margin-top: 0.5rem;
    }}
    .sidebar-brand-subtitle {{
        font-size: 0.75rem;
        color: {subtext_color};
    }}
    </style>
    """
