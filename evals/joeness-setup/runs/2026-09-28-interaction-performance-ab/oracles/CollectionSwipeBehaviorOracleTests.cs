using System.Reflection;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

// A Unity UI pointer-drag must change what the player sees on the collection page.
// The oracle does not inspect the swipe handler's fields or exact implementation.
public sealed class CollectionSwipeBehaviorOracleTests
{
    [Test]
    public void PlayerDragShowsTheNextCollectionPage()
    {
        EditorSceneManager.OpenScene("Assets/MergeDrop/Scenes/Game.unity");
        PlayerPrefs.DeleteKey(VisualSetProgressStore.SelectedKey);
        var controller = Object.FindFirstObjectByType<GameController>(FindObjectsInactive.Include);
        var hud = Object.FindFirstObjectByType<GameHud>(FindObjectsInactive.Include);
        var carousel = Find<RectTransform>("Canvas/ModalOverlay/CollectionPanel/Carousel");
        var name = Find<Text>("Canvas/ModalOverlay/CollectionPanel/Carousel/PreviewGroup/SetName");
        var eventSystem = Object.FindFirstObjectByType<EventSystem>(FindObjectsInactive.Include);
        var ownsEventSystem = eventSystem == null;
        if (ownsEventSystem)
            eventSystem = new GameObject("OracleEventSystem", typeof(EventSystem))
                .GetComponent<EventSystem>();

        try
        {
            SetField(controller, "_running", true);
            SetField(controller, "_paused", false);
            SetField(controller, "_activeVisualSet", VisualSetId.Default);
            SetField(controller, "_previewedVisualSet", VisualSetId.Default);
            hud.HideModal();
            controller.OpenPauseMenu();
            controller.OpenCollection();
            Assert.That(name.text, Is.EqualTo("DEFAULT FRUIT"));

            var target = ExecuteEvents.GetEventHandler<IDragHandler>(carousel.gameObject);
            Assert.That(target, Is.Not.Null, "A player drag must reach the carousel through Unity UI.");
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

            Assert.That(controller.PreviewedVisualSet, Is.EqualTo(VisualSetId.Pixel));
            Assert.That(name.text, Is.EqualTo("PIXEL FRUIT"));
        }
        finally
        {
            PlayerPrefs.DeleteKey(VisualSetProgressStore.SelectedKey);
            hud.HideModal();
            Time.timeScale = 1f;
            if (ownsEventSystem) Object.DestroyImmediate(eventSystem.gameObject);
        }
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
