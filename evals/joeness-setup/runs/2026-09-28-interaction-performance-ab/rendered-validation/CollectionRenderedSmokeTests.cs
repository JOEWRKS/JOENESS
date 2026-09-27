using System;
using System.Collections;
using System.IO;
using System.Reflection;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UI;

// Diagnostic-only: exercise the real Game scene and retain pre/post UI pixels.
public sealed class CollectionRenderedSmokeTests
{
    private GameController _controller;
    private GameHud _hud;
    private Text _setName;
    private RectTransform _carousel;
    private EventSystem _eventSystem;
    private bool _ownsEventSystem;

    [UnitySetUp]
    public IEnumerator SetUp()
    {
        yield return new EnterPlayMode();
        yield return EditorSceneManager.LoadSceneAsyncInPlayMode(
            "Assets/MergeDrop/Scenes/Game.unity", new LoadSceneParameters(LoadSceneMode.Single));
        yield return null;

        _controller = UnityEngine.Object.FindFirstObjectByType<GameController>();
        _hud = UnityEngine.Object.FindFirstObjectByType<GameHud>();
        _setName = Find<Text>("Canvas/ModalOverlay/CollectionPanel/Carousel/PreviewGroup/SetName");
        _carousel = Find<RectTransform>("Canvas/ModalOverlay/CollectionPanel/Carousel");
        _eventSystem = UnityEngine.Object.FindFirstObjectByType<EventSystem>(FindObjectsInactive.Include);
        _ownsEventSystem = _eventSystem == null;
        if (_ownsEventSystem)
            _eventSystem = new GameObject("RenderProofEventSystem", typeof(EventSystem))
                .GetComponent<EventSystem>();
    }

    [UnityTearDown]
    public IEnumerator TearDown()
    {
        Time.timeScale = 1f;
        if (_ownsEventSystem && _eventSystem != null)
            UnityEngine.Object.Destroy(_eventSystem.gameObject);
        yield return new ExitPlayMode();
    }

    [UnityTest]
    public IEnumerator DesktopCollectionDragRenders() => Verify(1440, 900, "desktop");

    [UnityTest]
    public IEnumerator MobileSizedCollectionDragRenders() => Verify(390, 844, "mobile-sized");

    private IEnumerator Verify(int width, int height, string label)
    {
        Screen.SetResolution(width, height, false);
        yield return null;
        yield return new WaitForEndOfFrame();

        Assert.That(_controller, Is.Not.Null);
        Assert.That(_hud, Is.Not.Null);
        SetField(_controller, "_activeVisualSet", VisualSetId.Default);
        _controller.OpenPauseMenu();
        Assert.That(_hud.IsPauseMenuVisible, Is.True);
        _controller.OpenCollection();
        Assert.That(_hud.IsCollectionVisible, Is.True);
        Assert.That(_setName.text, Is.EqualTo("DEFAULT FRUIT"));

        var runId = Environment.GetEnvironmentVariable("JOENESS_RENDER_RUN_ID") ?? "default";
        var outputRoot = Path.Combine(Application.dataPath, "..", "RenderedEvidence", runId);
        Directory.CreateDirectory(outputRoot);
        var before = Path.Combine(outputRoot, label + "-before.png");
        var after = Path.Combine(outputRoot, label + "-after.png");
        Assert.That(File.Exists(before) || File.Exists(after), Is.False,
            "Refusing to reuse a screenshot from an earlier run.");
        Canvas.ForceUpdateCanvases();
        yield return Capture(before);

        var target = ExecuteEvents.GetEventHandler<IDragHandler>(_carousel.gameObject);
        Assert.That(target, Is.Not.Null, "A real Unity UI drag must reach the collection carousel.");
        var scale = Mathf.Max(1f, _carousel.GetComponentInParent<Canvas>().scaleFactor);
        var start = new Vector2(240f, 320f);
        var pointer = new PointerEventData(_eventSystem)
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

        Assert.That(_controller.PreviewedVisualSet, Is.EqualTo(VisualSetId.Pixel));
        Assert.That(_setName.text, Is.EqualTo("PIXEL FRUIT"));
        Canvas.ForceUpdateCanvases();
        yield return Capture(after);

        TestContext.Progress.WriteLine($"{label}: Screen={Screen.width}x{Screen.height}; before={new FileInfo(before).Length}; after={new FileInfo(after).Length}");
        Assert.That(Screen.width, Is.EqualTo(width));
        Assert.That(Screen.height, Is.EqualTo(height));
    }

    private static IEnumerator Capture(string path)
    {
        yield return new WaitForEndOfFrame();
        ScreenCapture.CaptureScreenshot(path);
        var deadline = Time.realtimeSinceStartup + 10f;
        while (!File.Exists(path) && Time.realtimeSinceStartup < deadline)
            yield return null;
        Assert.That(File.Exists(path), Is.True, "Unity did not write a screenshot.");
        Assert.That(new FileInfo(path).Length, Is.GreaterThan(1000));
    }

    private static T Find<T>(string path) where T : Component
    {
        var canvas = GameObject.Find("Canvas");
        Assert.That(canvas, Is.Not.Null, path);
        var target = canvas.transform.Find(path.Substring("Canvas/".Length));
        Assert.That(target, Is.Not.Null, path);
        var component = target.GetComponent<T>();
        Assert.That(component, Is.Not.Null, path);
        return component;
    }

    private static void SetField(object target, string name, object value) =>
        target.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)
            .SetValue(target, value);
}
