
 <template>
  <div>
    <div id="buttons" v-if="debugMode">
      <button @click="getCamera">Get camera</button>
      <button @click="setCamera('out', 2)">out</button>
      <button @click="setCamera('front', 2)">front</button>
      <button @click="setCamera('closeside', 2)">close side</button>
      <button @click="setCamera('side', 2)">side</button>
    </div>

    <div v-show="isLoaded">
      <div id="logos">
        <a target="_blank" href="https://ibisdev.tech/"
          ><img src="/img/ibisdev.svg" width="70"
        /></a>
        <a target="_blank" href="https://www.biefferendering.com/">
          <img src="/img/bieffe.png" width="70"
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
      <iframe
        title="Ibisdev demo"
        :class="{ noClickeable: currentStep < 99, blur: currentStep == 1 }"
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

<script>
import camerasPosition from "./config/cameraPositions";
import contenido from "./config/contenido";
import sketchfabConfig from "./config/sketchfabConfig";

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
    };
  },
  mounted() {
    const version = "1.10.1";
    const uid = "897a00cc1d564033968004b0e5fe5d20"; //3D MODEL
    const iframe = document.getElementById("api-frame");
    const client = new window.Sketchfab(version, iframe);

    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);

    if (params.get("debug")) {
      this.debugMode = true;
    }

    client.init(uid, {
      success: (api) => {
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
            api.getMaterialList((err, mat) => {
              let metal = mat[0];

              let color = [0, 255, 0];
              metal.channels.DiffuseColor.color = color;
              api.setMaterial(metal, function () {});
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
      this.currentStep = 0;
      this.setCamera("front", 3);
    },
    hideHint() {
      this.currentStep = 99;
      this.setCamera("last", 2);
    },
    getCamera() {
      this.api.getCameraLookAt(function (err, camera) {
        window.console.log(camera.position); // [x, y, z]
        window.console.log(camera.target); // [x, y, z]
      });
    },
    setCamera(camera, duration) {
      let device =
        typeof screen.orientation !== "undefined" ? "desktop" : "mobile";
      this.api.setCameraLookAt(
        camerasPosition[device][camera].position,
        camerasPosition[device][camera].target,
        duration
      );
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

