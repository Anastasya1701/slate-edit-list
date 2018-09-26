import expect from 'expect';

export default function(plugin, change) {
    plugin.changes.splitListItem(change);

    // check new selection
    const selectedNode = change.value.document.getTexts().get(2);

    expect(change.value.selection.toJS()).toMatch(change.value.document.createSelection({
      anchor: {
        key: selectedNode.key,
        offset: 0,
      },
      focus: {
        key: selectedNode.key,
        offset: 0,
      },
      isFocused: true,
    }).toJS());

    return change;
}
