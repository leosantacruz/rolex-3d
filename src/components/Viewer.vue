
 <template>
  <div>
    <div v-show="isLoaded">
      <div id="logos">
        <a href=""><img src="img/ibisdev.svg" width="70" /></a>
        <a href=""> <img src="img/bieffe.png" width="70" /></a>
      </div>
      <Transition name="slide-fade">
        <div id="contenido" :key="currentStep" v-if="currentStep < 2">
          <h1>{{ contenido[currentStep].titulo }}</h1>
          <p>{{ contenido[currentStep].descripcion }}</p>
          <div class="button" @click="nextStep">Continue</div>
        </div>
      </Transition>

      <Transition name="out-fade">
        <div v-if="currentStep == 2" id="lastStep" @click="hideHint()">
          <h1>{{ contenido[currentStep].titulo }}</h1>
        </div>
      </Transition>

      <div id="buttons">
        <button @click="getCamera">Get camera</button>
        <button @click="setCamera('out', 2)">out</button>
        <button @click="setCamera('front', 2)">front</button>
        <button @click="setCamera('closeside', 2)">close side</button>
        <button @click="setCamera('side', 2)">side</button>
      </div>

      <Transition name="out-fade">
        <div
          v-if="currentStep == 99"
          class="button"
          id="restartBtn"
          @click="restart()"
        >
          Restart
        </div>
      </Transition>
      <iframe
        title="Ibisdev demo"
        :class="{ noClickeable: currentStep < 99 }"
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
export default {
  name: "Viewer",
  data() {
    return {
      isLoaded: false,
      loadingProgress: 1300,
      api: "",
      currentStep: 0,
      contenido: [
        {
          titulo: "Interactive visuals for watches and jewels",
          descripcion:
            "Real time 3d rendering for institutional and ecommerce websites",
          nextCamera: "closeside",
        },
        {
          titulo: "Dynamic imaging of products",
          descripcion: "Manipulate the item asi it were real",
          nextCamera: "side",
        },
        {
          titulo: "Manipulate the item as it were real",
          descripcion: "",
          nextCamera: "front",
        },
      ],
    };
  },
  mounted() {
    var version = "1.10.1";
    var uid = "897a00cc1d564033968004b0e5fe5d20"; //3D MODEL
    var iframe = document.getElementById("api-frame");
    var client = new window.Sketchfab(version, iframe);

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
            setTimeout(() => {
              this.setCamera("front", 2);
            }, 1200);
          });
        });
      },
      autostart: 1,
      ui_controls: false,
      ui_general_controls: false,
      ui_help: false,
      ui_hint: 0,
      ui_infos: false,
      ui_settings: false,
      ui_watermark: false,
      ui_stop: false,
      ui_color: "ffffff",
      orbit_constraint_pan: false,
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
      const cameras = {
        out: {
          position: [
            0.0041586988897073145, 0.02052001778172866, -0.002317945905515299,
          ],
          target: [
            -0.00583113856131546, 0.01406527311730921, 0.0000995020792399354,
          ],
        },
        front: {
          position: [
            0.3499382751832953, -0.4665291751858327, -0.11746574518396861,
          ],
          target: [
            -0.04232865973745763, -0.04365417923306779, 0.00011192461729403066,
          ],
        },

        closeside: {
          position: [
            0.06388709610435853, -0.22891768096209997, -0.08407767097896611,
          ],
          target: [
            -0.03624468578937616, -0.019989491929537147, 0.014326623618445972,
          ],
        },
        side: {
          position: [
            0.7181416724424008, 0.012381204390448368, -0.01802795989055816,
          ],
          target: [
            0.0029771479771914296, 0.0008249995827618573,
            -0.0010976950763200643,
          ],
        },

        last: {
          position: [
            0.022919603241496694, -0.7143408962616135, 0.0034318401018280263,
          ],
          target: [
            0.0029771479771914305, 0.0008249995827618578,
            -0.0010976950763200647,
          ],
        },
      };
      this.api.setCameraLookAt(
        cameras[camera].position,
        cameras[camera].target,
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

