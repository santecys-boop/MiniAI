package com.mini.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LlamaPlugin")
public class LlamaPlugin extends Plugin {

    @PluginMethod
    public void downloadModel(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("fileName", "model.gguf");
        ret.put("downloadId", 0);
        call.resolve(ret);
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("info", "Dummy plugin - offline mode UI only");
        call.resolve(ret);
    }

    @PluginMethod
    public void generate(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("text", "Offline inference not implemented yet");
        call.resolve(ret);
    }

    @PluginMethod
    public void isModelLoaded(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("loaded", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void getDownloadStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isComplete", false);
        ret.put("progress", 0);
        call.resolve(ret);
    }

    @PluginMethod
    public void getModelRecommendation(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("category", "3B");
        call.resolve(ret);
    }

    @PluginMethod
    public void unloadModel(PluginCall call) {
        call.resolve();
    }
}
