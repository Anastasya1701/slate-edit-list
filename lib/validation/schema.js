// @flow
import { type Change, type Node } from 'slate';

import { joinLists } from './validateNode';
import type Options from '../options';

/**
 * Create a schema definition with rules to normalize lists
 */
function schema(opts: Options): Object {
    const constructedSchema = {
        blocks: {
            [opts.typeItem]: {
                parent: opts.types.map(type => ({ type })),
                nodes: [{ match: { object: 'block' } }],

                normalize: normalize({
                    parent_type_invalid: (change, error) =>
                        change.withoutNormalizing(() => {
                          change.unwrapBlockByKey(error.node.key);
                        }),
                    child_object_invalid: (change, error) =>
                        wrapChildrenInDefaultBlock(opts, change, error.node)
                })
            }
        }
    };

    // validate all list types, ensure they only have list item children
    opts.types.forEach(type => {
        constructedSchema.blocks[type] = {
            nodes: [{ match: { type: opts.typeItem } }],
            next: { type: t => t !== type },
            normalize: normalize({
                child_type_invalid: (change, error) =>
                    change.withoutNormalizing(() => {
                        change.wrapBlockByKey(error.child.key, opts.typeItem);
                    }),
                next_sibling_type_invalid: (change, error) => {
                    joinLists(error.child, error.next)(change)
                }
            })
        };
    });

    return constructedSchema;
}

/*
 * Allows to define a normalize function through a keyed collection of functions
 */
function normalize(reasons: { [string]: (Change, context: any) => any }): * {
    return (change, error) => {
        const reasonFn = reasons[error.code];
        if (reasonFn) {
            reasonFn(change, error);
        }
    };
}

/**
 * Wraps all child of a node in the default block type.
 * Returns a change, for chaining purposes
 */
function wrapChildrenInDefaultBlock(
    opts: Options,
    change: Change,
    node: Node
): Change {
    change.withoutNormalizing(() => {
      change.wrapBlockByKey(node.nodes.first().key, opts.typeDefault);
    });

    const wrapper = change.value.document.getDescendant(node.key).nodes.first();

    // Add in the remaining items
    change.withoutNormalizing(() => {
      node.nodes.rest().forEach((child, index) =>
          change.moveNodeByKey(child.key, wrapper.key, index + 1)
      );
    });

    return change;
}

export default schema;
