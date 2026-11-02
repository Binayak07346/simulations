#!/bin/sh
# headless-only test Chrome with NO sound: speechSynthesis ignores --mute-audio, so disable it too
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --mute-audio --disable-features=WebSpeechSynthesis "$@"
