@echo off
cd /d "%~dp0"
title Iniciar Sistema GAP - Gestao de Ativos
cls
echo ===================================================
echo             INICIANDO SISTEMA GAP
echo ===================================================
echo.
echo Tentando iniciar o servidor Streamlit localmente...
echo.
py -m streamlit run app.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Ocorreu um problema ao iniciar o Streamlit.
    echo Certifique-se de que o Python e as dependencias estao instalados.
    echo.
    echo Para instalar as dependencias, execute:
    echo py -m pip install streamlit pandas openpyxl
    echo.
    pause
)
