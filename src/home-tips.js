// Uses the official chunk's existing React and JSX runtimes. The new components
// only provide home presentation; original editor and project handlers pass through.
function YaoHomeInputIsFocused(root) {
  const active = globalThis.document?.activeElement;
  return Boolean(root && active && root.contains(active) &&
    (active.matches?.('input, textarea, select, [contenteditable="true"], [role="textbox"]') ||
     active.closest?.('[contenteditable="true"], [role="textbox"]')));
}

function YaoHomeTips({context}) {
  const [index, setIndex] = L9.useState(0);
  const [phase, setPhase] = L9.useState('in');
  const ref = L9.useRef(null);
  L9.useEffect(() => {
    const motion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    let interval = null;
    let reveal = null;
    let disposed = false;
    const clear = () => {
      if (interval != null) clearInterval(interval);
      if (reveal != null) clearTimeout(reveal);
      interval = null;
      reveal = null;
    };
    const start = () => {
      clear();
      if (disposed || motion?.matches || YAO_HOME_TIPS.length < 2) return;
      interval = setInterval(() => {
        const root = ref.current?.closest('[data-yao-home]');
        if (globalThis.document?.hidden || YaoHomeInputIsFocused(root)) return;
        setPhase('out');
        reveal = setTimeout(() => {
          reveal = null;
          if (disposed) return;
          if (!YaoHomeInputIsFocused(root)) {
            setIndex(value => (value + 1) % YAO_HOME_TIPS.length);
          }
          setPhase('in');
        }, 220);
      }, 3000);
    };
    const onMotionChange = () => { setPhase('in'); start(); };
    motion?.addEventListener?.('change', onMotionChange);
    start();
    return () => {
      disposed = true;
      clear();
      motion?.removeEventListener?.('change', onMotionChange);
    };
  }, []);
  return H9.jsxs('span', {
    ref,
    className: 'yao-home-tips',
    'data-yao-home-tips': '',
    children: [
      H9.jsx('span', {className: 'yao-home-tip-label', children: '姚同学 视频素材助手'}),
      H9.jsx('span', {
        className: 'yao-home-tip-viewport',
        'aria-live': 'off',
        children: H9.jsx('span', {
          className: 'yao-home-tip-copy',
          title: typeof YAO_HOME_TIP_SOURCES === 'undefined' ? undefined : YAO_HOME_TIP_SOURCES[YAO_HOME_TIPS[index]],
          'data-phase': phase,
          children: YAO_HOME_TIPS[index],
        }),
      }),
      H9.jsx('span', {className: 'yao-home-tip-context', children: context}),
    ],
  });
}

function YaoHomePosters() {
  return K9.jsx('div', {
    className: 'yao-home-posters',
    'data-yao-home-posters': '',
    'aria-hidden': true,
    role: 'presentation',
    children: K9.jsx('div', {
      className: 'yao-home-poster-grid',
      children: [0, 1, 2].map(column => {
        const posters = YAO_HOME_POSTERS.filter((_, index) => index % 3 === column);
        // Long identical groups keep tall windows covered throughout the loop.
        const sequence = [...posters, ...posters, ...posters];
        return K9.jsx('div', {
          className: 'yao-home-poster-column',
          children: K9.jsx('div', {
            className: 'yao-home-poster-track',
            children: [0, 1, 2].map(copy => K9.jsx('div', {
              className: 'yao-home-poster-group',
              children: sequence.map((poster, index) => K9.jsx('div', {
                className: 'yao-home-poster',
                children: K9.jsx('img', {
                  src: new URL(poster.src, import.meta.url).href,
                  alt: '',
                  loading: 'eager',
                  decoding: 'async',
                  draggable: false,
                }),
              }, `${poster.title}-${index}`)),
            }, copy)),
          }),
        }, column);
      }),
    }),
  });
}

function YaoHomeSurface(props) {
  return K9.jsxs('div', {
    ...props,
    'data-yao-home': '',
    children: [K9.jsx(YaoHomePosters, {}, 'yao-home-posters'), props.children],
  });
}
