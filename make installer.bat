@echo off
adt -package -storetype pkcs12 -keystore ../certificate.p12 PJF-Monster-Debugger.air pjfmonsterdebugger-app.xml .
pause;