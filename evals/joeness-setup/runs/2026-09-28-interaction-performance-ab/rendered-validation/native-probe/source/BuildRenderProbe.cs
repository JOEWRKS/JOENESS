using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

public static class BuildRenderProbe
{
    public static void Build()
    {
        var output = Environment.GetEnvironmentVariable("JOENESS_RENDER_BUILD");
        if (string.IsNullOrWhiteSpace(output))
            throw new InvalidOperationException("JOENESS_RENDER_BUILD is required.");
        Directory.CreateDirectory(output);
        var executable = Path.Combine(output, "MergeDropProbe.exe");
        if (File.Exists(executable))
            throw new InvalidOperationException("Refusing to overwrite an existing probe build.");

        var options = new BuildPlayerOptions
        {
            scenes = new[] { "Assets/MergeDrop/Scenes/Game.unity" },
            locationPathName = executable,
            target = BuildTarget.StandaloneWindows64,
            options = BuildOptions.Development
        };
        var report = BuildPipeline.BuildPlayer(options);
        Debug.Log($"RENDER_PROBE_BUILD result={report.summary.result} errors={report.summary.totalErrors} warnings={report.summary.totalWarnings} output={report.summary.outputPath}");
        if (report.summary.result != BuildResult.Succeeded)
            throw new InvalidOperationException("Render probe player build failed.");
    }
}
