
 <template>
  <div>
    <div id="debug" v-if="debugMode">
      <button @click="getCamera">Get camera</button>
      <button @click="setCamera('out', 2)">out</button>
      <button @click="setCamera('front', 2)">front</button>
      <button @click="setCamera('closeside', 2)">close side</button>
      <button @click="setCamera('side', 2)">side</button>
      <button @click="changeColor('red')">Red</button>
      <button @click="changeColor('blue')">Blue</button>
      <button @click="changeColor('green')">Green</button>
      <hr />
      Device: {{ device }}
    </div>

    <div v-show="isLoaded">
      <div id="nav">
        <a target="_blank" href="https://www.troisprime.com/us-ca/"
          ><img src="/img/logo.svg" width="170"
        /></a>
      </div>
      <Transition name="slide-fade">
        <div
          id="contenido"
          class="flex-center"
          :key="currentStep"
          v-if="currentStep < 2"
        >
          <div>
            <h1>{{ contenido[currentStep].titulo }}</h1>
            <p>{{ contenido[currentStep].descripcion }}</p>
            <div class="button" @click="nextStep">Continue</div>
          </div>
        </div>
      </Transition>

      <Transition name="out-fade">
        <div v-if="currentStep == 2" id="lastStep" @click="hideHint()">
          <h1>{{ contenido[currentStep].titulo }}</h1>
          <div class="button">Click to interact</div>
        </div>
      </Transition>

      <Transition name="out-fade">
        <div
          v-if="currentStep == 99"
          class="button"
          id="restartBtn"
          @click="restart()"
          @touchstart="restart()"
        >
          Restart
        </div>
      </Transition>
      <Transition name="out-fade">
        <div v-if="currentStep == 99" id="actionsMenu">
          <div class="actionButton" @click="toggleAnimation()">
            <img src="../assets/img/play.png" width="40" />
          </div>
          <div class="actionButton" @click="changeColor('red')">
            <div class="color" style="background-color: #b1152a"></div>
          </div>

          <div class="actionButton" @click="changeColor('blue')">
            <div class="color" style="background-color: #6596d0"></div>
          </div>

          <div class="actionButton" @click="changeColor('green')">
            <div class="color" style="background-color: #08aca1"></div>
          </div>
          <div class="actionButton" @click="showAR()">
            <div id="popupAR" v-if="showPopupAR">
              <h4>Please scan the following QR code with your phone camera</h4>
              <img src="../assets/img/qr.png" />
            </div>
            <img src="../assets/img/ar.svg" width="40" />
          </div>
        </div>
      </Transition>

      <iframe
        :style="{ 'background-color': backgroundColor }"
        :class="{
          noClickeable: currentStep < 99 && !debugMode,
          blur: currentStep == 1,
        }"
        title="Ibisdev demo"
        src=""
        id="api-frame"
      ></iframe>
    </div>

    <div v-show="!isLoaded" id="loading">
      <svg
        width="174"
        height="174"
        viewBox="0 0 174 174"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="87" cy="87" r="86" stroke="white" stroke-width="2" />
      </svg>
    </div>
  </div>
</template>

<script lang="ts">
import camerasPosition from "../config/cameraPositions";
import contenido from "../config/contenido";
import sketchfabConfig from "../config/sketchfabConfig";
import Data from "../types/Data";
//Typescript interface for Windoow
declare global {
  interface Window {
    Sketchfab: any;
    opera: any;
  }
}

export default {
  name: "Viewer",
  data() {
    return {
      isLoaded: false,
      loadingProgress: 1300,
      api: "",
      currentStep: 0,
      contenido: contenido,
      debugMode: false,
      device: "",
      materials: null,
      animationState: false,
      showPopupAR: false,
      uid: "e40bc8c3f8a44abca9f2245b0f93b7c9",
      backgroundColor: "#640B17",
    } as Data;
  },
  mounted() {
    const version = "1.10.1";
    const iframe = document.getElementById("api-frame");
    const client = new window.Sketchfab(version, iframe);

    let url = window.location.search.substring(1);
    let params = new URLSearchParams(url);

    if (params.get("debug")) {
      this.debugMode = true;
    }

    client.init(this.uid, {
      success: (api: any) => {
        this.api = api;
        let progressStart = 1300;
        let progressEnd = 760;
        let progressDiff = progressStart - progressEnd;

        api.addEventListener("modelLoadProgress", (factor) => {
          this.loadingProgress = progressStart - progressDiff * factor.progress;
        });

        api.start(() => {
          api.addEventListener("viewerready", () => {
            this.setCamera("out", 0.3);
            this.isLoaded = true;

            api.setEnvironment({
              exposure: 1,
            });

            api.getMaterialList((err, mat) => {
              this.materials = mat;
              this.changeColor("red");
            });

            setTimeout(() => {
              this.setCamera("front", 2);
            }, 1200);
          });
        });
      },
      ...sketchfabConfig,
    });
  },
  methods: {
    nextStep() {
      this.setCamera(this.contenido[this.currentStep].nextCamera, 2);
      if (this.currentStep == this.contenido.length - 1) {
        this.currentStep = 0;
      } else {
        this.currentStep++;
      }
    },
    restart() {
      this.cameraLimit(false);
      this.currentStep = 0;
      this.setCamera("front", 3);
    },
    hideHint() {
      this.cameraLimit(true);

      this.currentStep = 99;
      this.setCamera("last", 2);
    },
    getCamera() {
      this.api.getCameraLookAt(function (err, camera) {
        window.console.log(camera.position); // [x, y, z]
        window.console.log(camera.target); // [x, y, z]
      });
    },
    changeColor(color: string) {
      let factor = 300;
      let listColors = {
        red: [138, 13, 13, "#640B17"],
        blue: [101, 150, 208, "#2E4561"],
        green: [8, 172, 161, "#044D48"],
      };

      let listModelNodes: Array<number> = [0, 1, 2];
      let currentMaterial: any;
      let r = 2;
      currentMaterial = JSON.parse(JSON.stringify(this.materials))[r];
      currentMaterial.channels.AlbedoPBR.texture = false;
      currentMaterial.channels.AlbedoPBR.factor = 1;
      currentMaterial.channels.AlbedoPBR.color = [
        listColors[color][0] / 255,
        listColors[color][1] / 255,
        listColors[color][2] / 255,
      ];
      currentMaterial.channels.AlbedoPBR.enable = true;
      this.api.setMaterial(currentMaterial);
      this.backgroundColor = listColors[color][3];
    },
    toggleAnimation() {
      this.animationState = !this.animationState;
      let animationId =
        this.animationState == true
          ? "eeb51f4d8d9243fea836ac983a064b68"
          : "baa1137ae5da4a8c959563846451cf9b";
      this.api.setCycleMode("one");
      this.api.setSpeed(8);
      this.api.setCurrentAnimationByUID(animationId);
      this.api.play();
    },
    cameraLimit(value) {
      if (value) {
        this.api.setCameraConstraints({
          useCameraConstraints: true,
          useZoomConstraints: true,
          zoomIn: 0.59,
        });
      } else {
        this.api.setCameraConstraints({
          useCameraConstraints: false,
          useZoomConstraints: false,
        });
      }
    },
    mobileCheck() {
      let check = false;
      (function (a) {
        if (
          /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
            a
          ) ||
          /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
            a.substr(0, 4)
          )
        )
          check = true;
      })(navigator.userAgent || navigator.vendor || window.opera);
      return check;
    },

    setCamera(camera: string, duration: number) {
      console.log(camera);
      this.device = this.mobileCheck() ? "mobile" : "desktop";
      this.api.setCameraLookAt(
        camerasPosition[this.device][camera].position,
        camerasPosition[this.device][camera].target,
        duration
      );
    },
    showAR() {
      if (!this.mobileCheck()) {
        this.showPopupAR = !this.showPopupAR;
      } else {
        window.location.href =
          "https://sketchfab.com/models/" + this.uid + "/ar-redirect";
      }
    },
  },
};
</script>

<style>
#loading circle {
  stroke-dasharray: 1300;
  stroke-dashoffset: v-bind(loadingProgress);
  animation: dash 10s linear infinite;
}
</style>

