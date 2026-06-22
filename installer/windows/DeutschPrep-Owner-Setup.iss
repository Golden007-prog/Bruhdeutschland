; =============================================================================
;  DeutschPrep -- Owner-Mode Setup (Inno Setup script)
; =============================================================================
;
;  WHAT THIS PACKAGES
;  ------------------
;  A thin wizard that ships ONE file -- install.ps1 -- and runs it on finish.
;  It does NOT bundle Node, git, the app, or any binary. install.ps1 is the
;  real bootstrapper: it downloads Node/git/the app at runtime. This wizard
;  exists only to give a friendly welcome page + a folder picker + a "Run"
;  finish action.
;
;  HOW TO COMPILE
;  --------------
;  Install Inno Setup (https://jrsoftware.org/isinfo.php), then either:
;    * Open this .iss in the Inno Setup IDE and press F9 (Compile), or
;    * Command line:
;        "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" DeutschPrep-Owner-Setup.iss
;  The output .exe lands in .\Output\ (see OutputDir below).
;
;  UNSIGNED -- READ THIS
;  --------------------
;  The produced installer is UNSIGNED. On first run Windows SmartScreen will
;  warn ("Windows protected your PC" -> "More info" -> "Run anyway"). That is
;  expected for an unsigned download. Publish a SHA-256 checksum next to the
;  .exe on your GitHub Release so users can verify it (Get-FileHash). See
;  installer\README.md for the full honesty section on signing/SmartScreen.
;
;  The .exe is a build ARTIFACT -- do NOT commit it. Attach it (plus its
;  .sha256) to a GitHub Release instead.
; =============================================================================

#define MyAppName "DeutschPrep Owner Mode"
#define MyAppVersion "0.1.2"
#define MyAppPublisher "DeutschPrep"
#define MyAppURL "https://github.com/Golden007-prog/Bruhdeutschland"

[Setup]
AppId={{8E5C2D1A-7F3B-4A6E-9C21-DEUTSCHPREP01}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
; The "directory page" below IS our folder picker; default = %USERPROFILE%\DeutschPrep.
DefaultDirName={userpf}\DeutschPrep
DisableProgramGroupPage=yes
; We don't install files into a Program Files area; keep it per-user, no admin.
PrivilegesRequired=lowest
OutputDir=Output
OutputBaseFilename=DeutschPrep-Owner-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
; Show the licence/info pages so the user knows what they're agreeing to.
DisableWelcomePage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
; Custom welcome text describing EXACTLY what the bootstrapper will do.
WelcomeLabel2=This wizard will set up DeutschPrep "Owner Mode" on your PC.%n%nIt is a BOOTSTRAPPER: on finish it runs an auditable PowerShell script (install.ps1) that will, with your confirmation:%n  - install Node.js + git if missing (via winget or the official MSI),%n  - download the app source from GitHub,%n  - run "npm install",%n  - install Claude Code and let you log in to YOUR Claude subscription,%n  - start Owner Mode on http://localhost:8787.%n%nIt stores NO credentials. Your Claude login is kept by Claude Code itself.%n%nThe chosen folder on the next page is where the app will be installed.

[Files]
; Ship ONLY the script. It is the auditable source the user can inspect.
; "ignoreversion" so re-installs always lay down the latest script.
Source: "install.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Run]
; On finish, run install.ps1 with ExecutionPolicy Bypass and pass the chosen
; directory so the script skips its own folder picker and uses {app}.
; runascurrentuser keeps it in the user's context (subscription, not admin).
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\install.ps1"" -InstallRoot ""{app}"""; \
  Description: "Run DeutschPrep Owner-Mode setup now"; \
  Flags: postinstall runascurrentuser shellexec

[UninstallDelete]
; Best-effort cleanup of the launcher the script writes into the repo folder.
Type: files; Name: "{app}\start-owner.cmd"

[Code]
// Friendly reminder shown right before the wizard closes, reinforcing that the
// heavy lifting (and any further prompts) happen in the PowerShell window.
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssDone then
    MsgBox('Setup will now (if you left the checkbox ticked) open a PowerShell ' +
           'window to finish installation. Follow the prompts there -- including ' +
           'logging in to your own Claude subscription. Nothing is stored by this installer.',
           mbInformation, MB_OK);
end;
