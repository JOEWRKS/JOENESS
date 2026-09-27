using System;
using System.Collections;
using System.IO;
using System.Reflection;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public sealed class CollectionPlayerRenderProbe : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void Install()
    {
        Debug.Log("RENDER_PROBE_INSTALL env=" + Environment.GetEnvironmentVariable("JOENESS_RENDER_PROBE"));
        if (Environment.GetEnvironmentVariable("JOENESS_RENDER_PROBE") != "1") return;
        Application.runInBackground = true;
        var host = new GameObject("CollectionPlayerRenderProbe");
        DontDestroyOnLoad(host);
        host.AddComponent<CollectionPlayerRenderProbe>();
    }

    private IEnumerator Start()
    {
        Debug.Log("RENDER_PROBE_START");
        var output = Environment.GetEnvironmentVariable("JOENESS_RENDER_EVIDENCE_DIR");
        var label = Environment.GetEnvironmentVariable("JOENESS_RENDER_LABEL");
        if (string.IsNullOrWhiteSpace(output) || string.IsNullOrWhiteSpace(label))
        {
            Application.Quit(2);
            yield break;
        }
        Directory.CreateDirectory(output);
        var width = int.Parse(Environment.GetEnvironmentVariable("JOENESS_RENDER_WIDTH"));
        var height = int.Parse(Environment.GetEnvironmentVariable("JOENESS_RENDER_HEIGHT"));
        Screen.SetResolution(width, height, false);
        for (var i = 0; i < 10; i++) yield return null;

        var controller = FindFirstObjectByType<GameController>();
        var hud = FindFirstObjectByType<GameHud>();
        var canvas = GameObject.Find("Canvas");
        var carousel = canvas?.transform.Find("ModalOverlay/CollectionPanel/Carousel")
            ?.GetComponent<RectTransform>();
        var name = canvas?.transform.Find("ModalOverlay/CollectionPanel/Carousel/PreviewGroup/SetName")
            ?.GetComponent<Text>();
        if (controller == null || hud == null || carousel == null || name == null)
        {
            Fail(output, label, "Required Game scene object is missing.");
            yield break;
        }

        SetField(controller, "_activeVisualSet", VisualSetId.Default);
        controller.OpenPauseMenu();
        controller.OpenCollection();
        if (!hud.IsCollectionVisible || name.text != "DEFAULT FRUIT")
        {
            Fail(output, label, "Default collection state is not visible: " + name.text);
            yield break;
        }

        var before = Path.Combine(output, label + "-before.png");
        var after = Path.Combine(output, label + "-after.png");
        if (File.Exists(before) || File.Exists(after))
        {
            Fail(output, label, "Existing screenshot found; refusing stale evidence.");
            yield break;
        }
        var rootCanvas = canvas.GetComponent<Canvas>();
        Canvas.ForceUpdateCanvases();
        yield return CaptureOffscreen(rootCanvas, width, height, before);
        if (!File.Exists(before))
        {
            Fail(output, label, "Before screenshot was not saved.");
            yield break;
        }

        var eventSystem = FindFirstObjectByType<EventSystem>(FindObjectsInactive.Include);
        if (eventSystem == null)
            eventSystem = new GameObject("RenderProbeEventSystem", typeof(EventSystem))
                .GetComponent<EventSystem>();
        var target = ExecuteEvents.GetEventHandler<IDragHandler>(carousel.gameObject);
        if (target == null)
        {
            Fail(output, label, "Unity UI has no drag target for the carousel.");
            yield break;
        }
        var scale = Mathf.Max(1f, carousel.GetComponentInParent<Canvas>().scaleFactor);
        var start = new Vector2(240f, 320f);
        var pointer = new PointerEventData(eventSystem)
        {
            position = start,
            pressPosition = start,
            pointerDrag = target,
            dragging = true
        };
        ExecuteEvents.Execute(target, pointer, ExecuteEvents.beginDragHandler);
        pointer.position = start + Vector2.left * (80f * scale);
        ExecuteEvents.Execute(target, pointer, ExecuteEvents.dragHandler);
        ExecuteEvents.Execute(target, pointer, ExecuteEvents.endDragHandler);
        if (controller.PreviewedVisualSet != VisualSetId.Pixel || name.text != "PIXEL FRUIT")
        {
            Fail(output, label, "Drag did not show PIXEL FRUIT: " + name.text);
            yield break;
        }

        Canvas.ForceUpdateCanvases();
        yield return CaptureOffscreen(rootCanvas, width, height, after);
        if (!File.Exists(after))
        {
            Fail(output, label, "After screenshot was not saved.");
            yield break;
        }
        var summary = $"requested={width}x{height}\nactual={Screen.width}x{Screen.height}\nrenderMode=offscreen-screen-space-camera\nbeforeBytes={new FileInfo(before).Length}\nafterBytes={new FileInfo(after).Length}\nstate=PIXEL FRUIT\n";
        File.WriteAllText(Path.Combine(output, label + "-result.txt"), summary);
        Debug.Log("RENDER_PROBE_PASS " + label + " " + summary.Replace('\n', ' '));
        Application.Quit(0);
    }

    private static IEnumerator CaptureOffscreen(Canvas canvas, int width, int height, string path)
    {
        var originalMode = canvas.renderMode;
        var originalCamera = canvas.worldCamera;
        var originalPlaneDistance = canvas.planeDistance;
        var cameraObject = new GameObject("RenderProbeCamera");
        var camera = cameraObject.AddComponent<Camera>();
        camera.enabled = false;
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(0.75f, 0.75f, 0.75f, 1f);
        camera.cullingMask = ~0;
        camera.nearClipPlane = 0.01f;
        camera.farClipPlane = 1000f;
        var target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
        target.Create();
        camera.targetTexture = target;
        canvas.renderMode = RenderMode.ScreenSpaceCamera;
        canvas.worldCamera = camera;
        canvas.planeDistance = 100f;
        Canvas.ForceUpdateCanvases();
        yield return null;
        yield return new WaitForEndOfFrame();
        camera.Render();
        var previousActive = RenderTexture.active;
        RenderTexture.active = target;
        var image = new Texture2D(width, height, TextureFormat.RGB24, false);
        image.ReadPixels(new Rect(0, 0, width, height), 0, 0);
        image.Apply();
        File.WriteAllBytes(path, image.EncodeToPNG());
        RenderTexture.active = previousActive;
        canvas.renderMode = originalMode;
        canvas.worldCamera = originalCamera;
        canvas.planeDistance = originalPlaneDistance;
        camera.targetTexture = null;
        Destroy(image);
        target.Release();
        Destroy(target);
        Destroy(cameraObject);
    }

    private static void Fail(string output, string label, string message)
    {
        File.WriteAllText(Path.Combine(output, label + "-failure.txt"), message);
        Debug.LogError("RENDER_PROBE_FAIL " + label + " " + message);
        Application.Quit(3);
    }

    private static void SetField(object target, string name, object value) =>
        target.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)
            .SetValue(target, value);
}
