using System;
using NUnit.Framework;
using UnityEngine;

// Hidden during agent work. These checks assert observable state, not a required
// exception type or a particular private implementation.
public sealed class VisualSetBehaviorOracleTests
{
    private const int KnownUnlockBits = 0x0f; // IDs 0, 1, 2, and 3, by product enum.

    [SetUp, TearDown]
    public void ClearOwnedPreferences()
    {
        PlayerPrefs.DeleteKey(VisualSetProgressStore.UnlockedMaskKey);
        PlayerPrefs.DeleteKey(VisualSetProgressStore.SelectedKey);
        PlayerPrefs.Save();
    }

    [TestCase(32)]
    [TestCase(99)]
    public void UnknownIdNeverAliasesAnApprovedUnlockBit(int rawId)
    {
        int bit;
        try
        {
            bit = VisualSetProgressStore.Bit((VisualSetId)rawId);
        }
        catch (ArgumentException)
        {
            return; // Explicit rejection is as safe as returning a non-aliasing value.
        }

        Assert.That(bit & KnownUnlockBits, Is.Zero,
            "An unknown ID must not become a valid visual-set unlock bit.");
    }

    [TestCase(-1)]
    [TestCase(99)]
    public void UnknownSelectionPreservesThePreviouslySavedChoice(int rawId)
    {
        var store = new VisualSetProgressStore();
        Assert.That(store.SaveSelected(VisualSetId.Cute), Is.True);
        Assert.That(PlayerPrefs.GetInt(VisualSetProgressStore.SelectedKey), Is.EqualTo(2));

        Assert.That(store.SaveSelected((VisualSetId)rawId), Is.False);
        Assert.That(PlayerPrefs.GetInt(VisualSetProgressStore.SelectedKey), Is.EqualTo(2));
        Assert.That(new VisualSetProgressStore().LoadSelected(), Is.EqualTo(VisualSetId.Cute));
    }

    [Test]
    public void UnknownUnlockDoesNotChangeStoredMask()
    {
        var store = new VisualSetProgressStore();
        Assert.That(store.Unlock(VisualSetId.Pixel), Is.True);
        Assert.That(PlayerPrefs.GetInt(VisualSetProgressStore.UnlockedMaskKey), Is.EqualTo(3));

        Assert.That(store.Unlock((VisualSetId)99), Is.False);
        Assert.That(PlayerPrefs.GetInt(VisualSetProgressStore.UnlockedMaskKey), Is.EqualTo(3));
    }

    [Test]
    public void ValidSelectionAndUnlockStillWork()
    {
        var store = new VisualSetProgressStore();
        Assert.That(store.SaveSelected(VisualSetId.Slime), Is.True);
        Assert.That(store.Unlock(VisualSetId.Slime), Is.True);
        Assert.That(new VisualSetProgressStore().LoadSelected(), Is.EqualTo(VisualSetId.Slime));
        Assert.That(new VisualSetProgressStore().LoadUnlockedMask() & 0x08, Is.EqualTo(0x08));
    }
}
