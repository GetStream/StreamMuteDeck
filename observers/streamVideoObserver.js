class StreamVideoObserver {
  constructor() {
    this._timer = null;
    this._observer = null;
    this._updateLoops = 0;

    this.isInMeeting = false;
    this.isMuted = false;
    this.isVideoStarted = false;
    this.isShareStarted = false;
    this.isRecordStarted = false;
  }

  initialize = () => {
    // detect whether a configured hostname is the hostname of the page, otherwise do not initialize
    if (
      !streamVideoURLs.some((url) => window.location.hostname.includes(url))
    ) {
      console.log(
        "Not on Stream page page, not initializing StreamVideoObserver"
      );
      return;
    }

    console.log("Initializing StreamVideoObserver");
    this._observer = new MutationObserver(this._handleElementChange);
    // listen for SVG class changes
    this._observer.observe(document.body, {
      childList: false,
      attributes: true,
      attributeFilter: ["data-testid"],
      attributeOldValue: true,
      subtree: true,
    });

    this._timer = setInterval(this.updateStreamVideoStatus, 1000);
  };

  _handleElementChange = (mutationsList) => {
    this.updateStreamVideoStatus();
  };

  updateStreamVideoStatus = () => {
    //console.log('Updating Stream Video status');
    let changed = false;

    // use the leave button to see if we're in a meeting
    let callDuration = document.querySelector(
      'div[class="rd__header__elapsed-time"]'
    );
    if (callDuration) {
      if (!this.isInMeeting) {
        changed = true;
      }
      this.isInMeeting = true;
    } else {
      if (this.isInMeeting) {
        changed = true;
      }
      this.isInMeeting = false;
    }

    if (this.isInMeeting) {
      // find the video button
      let buttonVideoUnmuted = document.querySelector(
        'button[data-testid="video-unmute-button"]'
      );
      if (buttonVideoUnmuted) {
        if (this.isVideoStarted) {
          changed = true;
        }
        this.isVideoStarted = false;
      } else {
        if (!this.isVideoStarted) {
          changed = true;
        }
        this.isVideoStarted = true;
      }

      // find the mute button
      let buttonMicUnmuted = document.querySelector(
        'button[data-testid="audio-unmute-button"]'
      );
      if (buttonMicUnmuted) {
        if (!this.isMuted) {
          changed = true;
        }
        this.isMuted = true;
      } else {
        if (!this.isMuted) {
          changed = true;
        }
        this.isMuted = false;
      }

      // find the recording indicator
      let buttonRecordingIndicator = document.querySelector(
        'button[data-testid="recording-start-button"]'
      );
      if (buttonRecordingIndicator) {
        if (this.isRecordStarted) {
          changed = true;
        }
        this.isRecordStarted = false;
      } else {
        if (!this.isRecordStarted) {
          changed = true;
        }
        this.isRecordStarted = true;
      }

      // find the sharing button

      let buttonShare = document.querySelector(
        'button[data-testid="screen-share-stop-button"]'
      );
      if (buttonShare) {
        let presenting = !buttonShare.hasAttribute("disabled");
        if (presenting) {
          if (!this.isShareStarted) {
            changed = true;
          }
          this.isShareStarted = true;
        }
      } else {
        if (this.isShareStarted) {
          changed = true;
        }
        this.isShareStarted = false;
      }
    } // end if this.isInMeeting

    // send meeting status if it has been updated, or if it's been 1 second (250ms * 4) since the last update
    if (changed || this._updateLoops >= 3) {
      this.sendStreamVideoStatus();
      this._updateLoops = 0;
    } else {
      this._updateLoops++;
    }
  };

  /**
   * Actions
   */

  toggleMute = () => {
    let micUnmuteButton = document.querySelector(
      "button[data-testid='audio-unmute-button']"
    );
    if (micUnmuteButton) {
      micUnmuteButton.click();
    } else {
      let micMuteButton = document.querySelector(
        "button[data-testid='audio-mute-button']"
      );
      if (micMuteButton) {
        micMuteButton.click();
      }
    }
  };

  toggleVideo = () => {
    let videoUnmuteButton = document.querySelector(
      "button[data-testid='video-unmute-button']"
    );
    if (videoUnmuteButton) {
      videoUnmuteButton.click();
    } else {
      let videoMuteButton = document.querySelector(
        "button[data-testid='video-mute-button']"
      );
      if (videoMuteButton) {
        videoMuteButton.click();
      }
    }
  };

  toggleShare = () => {
    let shareButton = document.querySelector(
      "button[data-testid='screen-share-start-button']"
    );
    if (shareButton) {
      shareButton.click();
    } else {
      let unshareButton = document.querySelector(
        "button[data-testid='screen-share-stop-button']"
      );
      if (unshareButton) {
        unshareButton.click();
      }
    }
  };

  toggleRecord = () => {
    let recordButton = document.querySelector(
      "button[data-testid='recording-start-button']"
    );
    if (recordButton) {
      recordButton.click();
    } else {
      let stopRecordButton = document.querySelector(
        "button[data-testid='recording-stop-button']"
      );
      if (stopRecordButton) {
        stopRecordButton.click();
        setTimeout(this._pressStopRecordingConfirmationButton, 250);
      }
    }
  };

  _pressStopRecordingConfirmationButton = () => {
    // find the second button nested inside the <div> with the class "str-video__end-recording__confirmation" and click it
    const mainDiv = document.querySelector(
      ".str-video__end-recording__confirmation"
    );

    if (mainDiv) {
      const buttons = mainDiv.querySelectorAll("button");

      if (buttons.length == 2) {
        const secondButton = buttons[1];
        if (secondButton) {
          console.log(secondButton);
          secondButton.click();
        }
      }
    }
  };

  leaveCall = () => {
    let buttonLeave = document.querySelector(
      'button[data-testid="leave-call-button"]'
    );
    if (buttonLeave) {
      buttonLeave.click();
    }
  };

  sendStreamVideoStatus = () => {
    if (!this.isInMeeting) {
      return;
    }
    const message = {
      source: "browser-extension-plugin",
      action: "update-status",
      status: this.isInMeeting ? "call" : "closed",
      mute: this.isMuted ? "muted" : "unmuted",
      video: this.isVideoStarted ? "started" : "stopped",
      share: this.isShareStarted ? "started" : "stopped",
      record: this.isRecordStarted ? "started" : "stopped",
      custom_svg_path: ":/images/logo.svg",
    };
    console.log(message);
    chrome.runtime.sendMessage({
      action: "updateMuteDeckStatus",
      message: message,
    });
  };
}
