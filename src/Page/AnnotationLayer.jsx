import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import makeCancellable from 'make-cancellable-promise';
import invariant from 'tiny-invariant';
import warning from 'tiny-warning';
import * as pdfjs from 'pdfjs-dist/build/pdf';

import DocumentContext from '../DocumentContext';
import PageContext from '../PageContext';

import { cancelRunningTask } from '../shared/utils';

import { isLinkService, isPage, isRotate } from '../shared/propTypes';

export function AnnotationLayerInternal({
  imageResourcesPath,
  linkService,
  onGetAnnotationsError: onGetAnnotationsErrorProps,
  onGetAnnotationsSuccess: onGetAnnotationsSuccessProps,
  onRenderAnnotationLayerError: onRenderAnnotationLayerErrorProps,
  onRenderAnnotationLayerSuccess: onRenderAnnotationLayerSuccessProps,
  page,
  renderForms,
  rotate: rotateProps,
  scale = 1,
}) {
  const [annotations, setAnnotations] = useState(undefined);
  const [annotationsError, setAnnotationsError] = useState(undefined);
  const layerElement = useRef();

  invariant(page, 'Attempted to load page annotations, but no page was specified.');

  warning(
    parseInt(
      window.getComputedStyle(document.body).getPropertyValue('--react-pdf-annotation-layer'),
      10,
    ) === 1,
    'AnnotationLayer styles not found. Read more: https://github.com/wojtekmaj/react-pdf#support-for-annotations',
  );

  function onLoadSuccess() {
    if (onGetAnnotationsSuccessProps) {
      onGetAnnotationsSuccessProps(annotations);
    }
  }

  function onLoadError() {
    warning(false, annotationsError);

    if (onGetAnnotationsErrorProps) {
      onGetAnnotationsErrorProps(annotationsError);
    }
  }

  function resetAnnotations() {
    setAnnotations(undefined);
    setAnnotationsError(undefined);
  }

  useEffect(resetAnnotations, [page]);

  function loadAnnotations() {
    const cancellable = makeCancellable(page.getAnnotations());
    const runningTask = cancellable;

    cancellable.promise.then(setAnnotations).catch((error) => {
      setAnnotations(false);
      setAnnotationsError(error);
    });

    return () => {
      cancelRunningTask(runningTask);
    };
  }

  useEffect(loadAnnotations, [page, renderForms]);

  useEffect(
    () => {
      if (annotations === undefined) {
        return;
      }

      if (annotations === false) {
        onLoadError();
        return;
      }

      onLoadSuccess();
    },
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations],
  );

  function onRenderSuccess() {
    if (onRenderAnnotationLayerSuccessProps) {
      onRenderAnnotationLayerSuccessProps();
    }
  }

  function onRenderError(error) {
    warning(false, error);

    if (onRenderAnnotationLayerErrorProps) {
      onRenderAnnotationLayerErrorProps(error);
    }
  }

  const viewport = useMemo(
    () => page.getViewport({ scale, rotation: rotateProps }),
    [page, rotateProps, scale],
  );

  function renderAnnotationLayer() {
    if (!annotations) {
      return;
    }

    const { current: layer } = layerElement;

    if (!layer) {
      return null;
    }

    const clonedViewport = viewport.clone({ dontFlip: true });

    const parameters = {
      annotations,
      div: layer,
      imageResourcesPath,
      linkService,
      page,
      renderForms,
      viewport: clonedViewport,
    };

    layer.innerHTML = '';

    try {
      pdfjs.AnnotationLayer.render(parameters);

      // Intentional immediate callback
      onRenderSuccess();
    } catch (error) {
      onRenderError(error);
    }

    return () => {
      // TODO: Cancel running task?
    };
  }

  useEffect(
    renderAnnotationLayer,
    // Ommitted callbacks so they are not called every time they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [annotations, imageResourcesPath, linkService, page, renderForms, viewport],
  );

  return <div className="react-pdf__Page__annotations annotationLayer" ref={layerElement} />;
}

AnnotationLayerInternal.propTypes = {
  imageResourcesPath: PropTypes.string,
  linkService: isLinkService.isRequired,
  onGetAnnotationsError: PropTypes.func,
  onGetAnnotationsSuccess: PropTypes.func,
  onRenderAnnotationLayerError: PropTypes.func,
  onRenderAnnotationLayerSuccess: PropTypes.func,
  page: isPage,
  renderForms: PropTypes.bool,
  rotate: isRotate,
  scale: PropTypes.number,
};

AnnotationLayerInternal.defaultProps = {
  // Can be moved to Page.defaultProps after renderInteractiveForms is removed
  renderForms: false,
  scale: 1,
};

const AnnotationLayer = (props) => (
  <DocumentContext.Consumer>
    {(documentContext) => (
      <PageContext.Consumer>
        {(pageContext) => (
          <AnnotationLayerInternal {...documentContext} {...pageContext} {...props} />
        )}
      </PageContext.Consumer>
    )}
  </DocumentContext.Consumer>
);

export default AnnotationLayer;
