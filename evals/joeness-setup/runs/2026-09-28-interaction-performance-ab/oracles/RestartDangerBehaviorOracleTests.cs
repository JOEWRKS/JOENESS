using System.Collections;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

// A restart must give the next run a fresh danger interval. This observes the
// real game-over overlay, not WarningZone's private timer or collection.
public sealed class RestartDangerBehaviorOracleTests
{
    [UnityTest]
    public IEnumerator StationaryDangerEndsAnUninterruptedRun()
    {
        EditorSceneManager.LoadSceneInPlayMode(
            "Assets/MergeDrop/Scenes/Game.unity",
            new LoadSceneParameters(LoadSceneMode.Single));
        yield return null;

        var game = Object.FindFirstObjectByType<GameController>();
        var warning = Object.FindFirstObjectByType<WarningZone>();
        var overlay = Object.FindObjectsByType<Transform>(
                FindObjectsInactive.Include, FindObjectsSortMode.None)
            .Single(item => item.name == "GameOverOverlay").gameObject;
        SetField(warning, "_dangerDuration", 0.8f);
        game.StartRun();
        SpawnStationaryDangerPiece(game);
        yield return new WaitForSecondsRealtime(1.2f);
        Assert.That(overlay.activeSelf, Is.True,
            "The hazard fixture must actually end a run after the configured interval.");
    }

    [UnityTest]
    public IEnumerator RestartDoesNotInheritThePreviousRunsDanger()
    {
        EditorSceneManager.LoadSceneInPlayMode(
            "Assets/MergeDrop/Scenes/Game.unity",
            new LoadSceneParameters(LoadSceneMode.Single));
        yield return null;

        var game = Object.FindFirstObjectByType<GameController>();
        var warning = Object.FindFirstObjectByType<WarningZone>();
        var overlay = Object.FindObjectsByType<Transform>(
                FindObjectsInactive.Include, FindObjectsSortMode.None)
            .Single(item => item.name == "GameOverOverlay").gameObject;
        Assert.That(game, Is.Not.Null);
        Assert.That(warning, Is.Not.Null);
        SetField(warning, "_dangerDuration", 0.8f);

        game.StartRun();
        SpawnStationaryDangerPiece(game);
        yield return new WaitForSecondsRealtime(0.6f);
        Assert.That(overlay.activeSelf, Is.False,
            "The first run must still be active before the danger interval expires.");

        game.Restart();
        var newPiece = SpawnStationaryDangerPiece(game);
        // Deliver the same Unity trigger event before the next Update so a
        // no-danger frame cannot accidentally erase the old run's timer.
        warning.SendMessage("OnTriggerEnter2D", newPiece.GetComponent<Collider2D>());
        yield return new WaitForSecondsRealtime(0.55f);
        Assert.That(overlay.activeSelf, Is.False,
            "A new run must not inherit danger accumulated before Restart.");
    }

    private static MergePiece SpawnStationaryDangerPiece(GameController game)
    {
        var spawn = typeof(GameController).GetMethod(
            "Spawn", BindingFlags.Instance | BindingFlags.NonPublic);
        var piece = (MergePiece)spawn.Invoke(game, new object[]
        {
            FruitTier.Blueberry,
            new Vector2(0f, 6.85f),
            false
        });
        piece.Body.gravityScale = 0f;
        piece.Body.linearVelocity = Vector2.zero;
        piece.Body.angularVelocity = 0f;
        Physics2D.SyncTransforms();
        Physics2D.Simulate(Time.fixedDeltaTime);
        return piece;
    }

    private static void SetField(object target, string name, object value) =>
        target.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)
            .SetValue(target, value);

}
