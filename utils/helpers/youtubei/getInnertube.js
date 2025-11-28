// Dynamic import for ES module
let Innertube, UniversalCache, Platform;
let ineerTubeInstance = null;
let youtubeiLoaded = false;

async function loadYoutubei() {
    if (!youtubeiLoaded) {
        const youtubei = await import("youtubei.js");
        Innertube = youtubei.Innertube;
        UniversalCache = youtubei.UniversalCache;
        Platform = youtubei.Platform;
        
        // Set up Platform.shim.eval once
        Platform.shim.eval = async (data, env) => {
            const properties = [];

            if (env.n) 
                properties.push(`n: exportedVars.nFunction("${env.n}")`);
  

            if (env.sig) 
                properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  

            const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

            return new Function(code)();
        };
        
        youtubeiLoaded = true;
    }
    return { Innertube, UniversalCache, Platform };
}

/**
 * Get the Innertube instance
 * @returns {Promise<Innertube>} The Innertube instance
 */
async function getInnertube(cookies) {
    await loadYoutubei();
    if (!ineerTubeInstance) {
        ineerTubeInstance = await Innertube.create({
            cache: new UniversalCache(false),
            // player_id: "0004de42",
            cookie: cookies,
        });
    }
    return ineerTubeInstance; 
}

module.exports = { getInnertube };