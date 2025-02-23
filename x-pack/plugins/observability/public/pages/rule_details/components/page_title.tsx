/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState } from 'react';
import moment from 'moment';
import { EuiText, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ExperimentalBadge } from '../../../components/shared/experimental_badge';
import { PageHeaderProps } from '../types';
import { useKibana } from '../../../utils/kibana_react';
import { LAST_UPDATED_MESSAGE, CREATED_WORD, BY_WORD, ON_WORD } from '../translations';

export function PageTitle({ rule }: PageHeaderProps) {
  const { triggersActionsUi } = useKibana().services;
  const [isTagsPopoverOpen, setIsTagsPopoverOpen] = useState<boolean>(false);
  const tagsClicked = () =>
    setIsTagsPopoverOpen(
      (oldStateIsTagsPopoverOpen) => rule.tags.length > 0 && !oldStateIsTagsPopoverOpen
    );
  const closeTagsPopover = () => setIsTagsPopoverOpen(false);
  return (
    <>
      {rule.name} <ExperimentalBadge />
      <EuiFlexGroup alignItems="baseline">
        <EuiFlexItem component="span" grow={false}>
          <EuiText color="subdued" size="xs">
            <b>{LAST_UPDATED_MESSAGE}</b> {BY_WORD} {rule.updatedBy} {ON_WORD}&nbsp;
            {moment(rule.updatedAt).format('ll')} &emsp;
            <b>{CREATED_WORD}</b> {BY_WORD} {rule.createdBy} {ON_WORD}&nbsp;
            {moment(rule.createdAt).format('ll')}
          </EuiText>
        </EuiFlexItem>

        {rule.tags.length > 0 &&
          triggersActionsUi.getRuleTagBadge({
            isOpen: isTagsPopoverOpen,
            tags: rule.tags,
            onClick: () => tagsClicked(),
            onClose: () => closeTagsPopover(),
          })}
      </EuiFlexGroup>
    </>
  );
}
