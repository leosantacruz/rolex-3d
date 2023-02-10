
 <template>
  <div>
    <div id="debug" v-if="debugMode">
      <button @click="getCamera">Get camera</button>
      <button @click="setCamera('out', 2)">out</button>
      <button @click="setCamera('front', 2)">front</button>
      <button @click="setCamera('closeside', 2)">close side</button>
      <button @click="setCamera('side', 2)">side</button>
      <button @click="changeColor('silver')">silver</button>
      <button @click="changeColor('gold')">gold</button>
      <hr />
      Device: {{ device }}
    </div>

    <div v-show="isLoaded">
      <div id="logos">
        <a target="_blank" href="https://ibisdev.tech/"
          ><img src="/img/ibisdev.svg" width="70"
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
          v-if="showRestart"
          class="button"
          id="restartBtn"
          @click="restart()"
          @touchstart="restart()"
        >
          Restart
        </div>
      </Transition>
      <Transition name="out-fade">
        <div>
          <div v-if="currentStep == 99">
            <div id="colorEditor">
              <div id="popupAR" v-if="showPopupAR">
                <h4>
                  Please scan the following QR code with your phone camera
                </h4>
                <img src="../assets/img/qr.png" />
              </div>
              <img @click="showAR()" src="../assets/img/ar.svg" width="40" />
            </div>
            <div id="colorSelector">
              <div class="categories">
                <div
                  class="category"
                  @click="selectedCategory = 'baseColors'"
                  :class="{ active: selectedCategory == 'baseColors' }"
                >
                  Choose a color
                </div>
              </div>
              <div class="colors">
                <div
                  class="color"
                  v-for="color in colors[selectedCategory]"
                  :style="{ background: color['hex'] }"
                  @click="changeColor(color)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      <iframe
        title="Ibisdev demo"
        :class="{
          noClickeable: currentStep < 99 && !debugMode,
          blur: currentStep == 1,
          showViewer: showViewer,
        }"
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
        <circle cx="87" cy="87" r="86" stroke="#000" stroke-width="2" />
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
      showViewer: false,
      isLoaded: false,
      showRestart: false,
      loadingProgress: 1300,
      api: "",
      currentStep: 0,
      contenido: contenido,
      debugMode: false,
      device: "",
      materials: null,
      animationState: false,
      showPopupAR: false,
      selectedCategory: "baseColors",
      customizations: {
        baseColor: "",
        numberColor: "",
      },
      textureUid: "674b799a5df44448890d82c789cf0498",
      colors: {
        baseColors: [
          { hex: "#D9D9D9", r: 217, g: 217, b: 217 },
          {
            hex: "#FFBF74",
            r: 0.6870308121546249 * 255,
            g: 0.5731588750675233 * 255,
            b: 0.2801243652610849 * 255,
          },
          {
            hex: "#FFAB7B",
            r: 255,
            g: 121,
            b: 80,
          },
          {
            hex: "#2A2A2A",
            r: 20,
            g: 20,
            b: 20,
          },
        ],
        numberColors: [
          { hex: "#323232", r: 10, g: 10, b: 10 },
          { hex: "#2F6E49", r: 47 * 0.5, g: 110 * 0.5, b: 73 * 0.5 },
          { hex: "#233C86", r: 35 * 0.5, g: 60 * 0.5, b: 134 * 0.5 },
        ],
        innerColors: [
          {
            hex: "#FFFFFF",
            r: 217,
            g: 217,
            b: 217,
            name: "white",
            url: "https://i.imgur.com/5myNSsv.jpg",
          },
          {
            hex: "#316E45",
            r: 255,
            g: 191,
            b: 116,
            name: "green",
            url: "https://i.imgur.com/gGgmQgU.jpg",
          },
          {
            hex: "#23314B",
            r: 99,
            g: 220,
            b: 247,
            name: "blue",
            url: "https://i.imgur.com/qvczqmx.jpg",
          },
        ],
      },
    } as Data;
  },
  mounted() {
    const version = "1.10.1";
    const uid = "e9e2516643ee4fa9a44184954bc2df2b"; //3D MODEL
    const iframe = document.getElementById("api-frame");
    const client = new window.Sketchfab(version, iframe);

    let url = window.location.search.substring(1);
    let params = new URLSearchParams(url);

    if (params.get("debug")) {
      this.debugMode = true;
    }

    client.init(uid, {
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
            api.getMaterialList((err, mat) => {
              this.isLoaded = true;
              this.materials = mat;
              console.log("Material", mat);
            });
            setTimeout(() => {
              this.setCamera("front", 2);
              this.showViewer = true;
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
      this.showRestart = false;
      this.currentStep = 0;

      this.cameraLimit(false);
      setTimeout(() => {
        this.setCamera("front", 3);
      }, 400);
    },
    hideHint() {
      this.currentStep = 99;
      this.setCamera("last", 2);
      setTimeout(() => {
        this.cameraLimit(true);
        this.showRestart = true;
      }, 2000);
    },
    getCamera() {
      this.api.getCameraLookAt(function (err, camera) {
        window.console.log(camera.position); // [x, y, z]
        window.console.log(camera.target); // [x, y, z]
      });
    },
    changeTexture(url: any) {
      this.api.updateTexture(url, this.textureUid, (err, textureUid) => {
        if (!err) {
          window.console.log("Replaced texture with UID", textureUid);
          this.textureUid = textureUid;
        }
      });
    },
    changeColor(color: any) {
      if (this.selectedCategory == "innerColors") {
        this.changeTexture(color.url);
      } else {
        let newColor = [color.r / 255, color.g / 255, color.b / 255];
        let watchPart: any = {
          baseColors: 3,
          numberColors: 1,
        };
        //let watchPartId = watchPart[this.selectedCategory];
        let watchPartId = 0;
        let currentMaterial = JSON.parse(JSON.stringify(this.materials))[
          watchPartId
        ];

        currentMaterial.channels.AlbedoPBR.color = newColor;
        this.api.setMaterial(currentMaterial);
      }
    },
    toggleAnimation() {
      this.animationState = !this.animationState;
      this.api.setCurrentAnimationByUID("f746fb7f06a64762bb09f51a9179db69");
      if (this.animationState) {
        this.api.play();
      } else {
        this.api.pause();
      }
    },
    cameraLimit(value) {
      if (value) {
        this.api.setCameraConstraints({
          useCameraConstraints: true,
          useZoomConstraints: true,
          zoomIn: 3.5,
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
          "https://sketchfab.com/models/674b799a5df44448890d82c789cf0498/ar-redirect";
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

#colorSelector {
  position: absolute;
  z-index: 100;
  background-color: #fff;
  box-shadow: rgb(0 0 0 / 24%) 0px 8px 20px;

  width: 280px;
  color: #000;
  border-radius: 5px;
  margin: 0 auto;
  left: 0;
  right: 0;
  bottom: 20px;
}
.categories {
  display: flex;
  font-weight: 600;
}
.categories .category {
  border-bottom: 2px solid #eee;
  flex: 1 1 0;
  width: 0;
  text-align: center;
  padding-top: 10px;
  padding-bottom: 10px;
  color: #000;
}
.categories .category:hover {
  cursor: pointer;
}
.categories .category.active {
  border-color: #eee;
  color: #000;
}

.colors {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: repeat(4, 1fr);
}
.colors .color {
  width: 33px;
  height: 33px;
  background-color: red;
  margin: 10px;
}
.colors .color:hover {
  cursor: pointer;
  opacity: 0.8;
}

#shakira {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 10;
}
</style>

