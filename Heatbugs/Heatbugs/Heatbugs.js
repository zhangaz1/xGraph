(function Heatbugs() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--Heatbugs/Setup');
		var Vlt = this.Vlt;
		var div = document.getElementById("Grok");
		Vlt.Render = new THREE.WebGLRenderer({antialias: true});
		//vlt.Render.setClearColor(0xF2EEE1, 1);
		Vlt.Render.setClearColor(0xBEDCF7, 1);
		Vlt.Render.setSize(div.scrollWidth, div.scrollHeight);
		Vlt.Scene = new THREE.Scene();
		Vlt.Focus = new THREE.Vector3(0.0, 0.0, 0.0);
		Vlt.Camera = new THREE.PerspectiveCamera(45,
			div.scrollWidth / div.scrollHeight, 0.1, 40000);
		div.appendChild(Vlt.Render.domElement);
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--Heatbugs/Start');
		var Vlt = this.Vlt;
		Vlt.Camera.position.x = -7;
		Vlt.Camera.position.y = -20.0;
		Vlt.Camera.position.z = 20.0;
		Vlt.Camera.up.set(0.0, 0.0, 1.0);
		Vlt.Camera.lookAt(Vlt.Focus);
		Vlt.Camera.updateProjectionMatrix();
		Vlt.Render.render(Vlt.Scene, Vlt.Camera);
		if(fun)
			fun();
	}

})();