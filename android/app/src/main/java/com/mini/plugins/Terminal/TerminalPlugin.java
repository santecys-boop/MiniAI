package com.mini.plugins.Terminal;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedReader;
import java.io.InputStreamReader;

@CapacitorPlugin(name = "Terminal")
public class TerminalPlugin extends Plugin {

    @PluginMethod
    public void exec(PluginCall call) {
        String command = call.getString("command", "");
        new Thread(() -> {
            try {
                // Direkt Android shell kullan!
                ProcessBuilder pb = new ProcessBuilder("/system/bin/sh", "-c", command);
                pb.redirectErrorStream(true);
                Process p = pb.start();
                BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
                StringBuilder output = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) output.append(line).append("\n");
                p.waitFor();
                reader.close();
                
                JSObject result = new JSObject();
                result.put("output", output.toString());
                result.put("exitCode", p.exitValue());
                call.resolve(result);
            } catch (Exception e) {
                JSObject result = new JSObject();
                result.put("output", "Hata: " + e.getMessage());
                result.put("exitCode", -1);
                call.resolve(result);
            }
        }).start();
    }
}
