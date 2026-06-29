import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EASE = 'expo.out';
const FAST_EASE = 'power3.out';

function splitChars(el: HTMLElement) {
	const text = el.textContent ?? '';
	el.textContent = '';
	const frag = document.createDocumentFragment();
	for (const word of text.split(/(\s+)/)) {
		if (/\s+/.test(word)) {
			frag.appendChild(document.createTextNode(word));
			continue;
		}
		const wordSpan = document.createElement('span');
		wordSpan.className = 'inline-block whitespace-nowrap overflow-hidden align-bottom';
		for (const ch of Array.from(word)) {
			const inner = document.createElement('span');
			inner.className = 'inline-block translate-y-[110%] will-change-transform';
			inner.textContent = ch;
			wordSpan.appendChild(inner);
		}
		frag.appendChild(wordSpan);
	}
	el.appendChild(frag);
	return Array.from(el.querySelectorAll<HTMLElement>('span > span'));
}

function splitWords(el: HTMLElement) {
	const text = el.textContent ?? '';
	el.textContent = '';
	const words = text.split(/(\s+)/);
	const frag = document.createDocumentFragment();
	for (const word of words) {
		if (/\s+/.test(word)) {
			frag.appendChild(document.createTextNode(word));
			continue;
		}
		const wrap = document.createElement('span');
		wrap.className = 'inline-block overflow-hidden align-bottom';
		const inner = document.createElement('span');
		inner.className = 'inline-block translate-y-[110%] will-change-transform';
		inner.textContent = word;
		wrap.appendChild(inner);
		frag.appendChild(wrap);
	}
	el.appendChild(frag);
	return Array.from(el.querySelectorAll<HTMLElement>('span > span'));
}

function initSplitReveal() {
	const els = document.querySelectorAll<HTMLElement>('[data-split]');
	els.forEach((el) => {
		const mode = el.getAttribute('data-split') ?? 'word';
		const targets = mode === 'char' ? splitChars(el) : splitWords(el);
		gsap.set(el, { opacity: 1 });
		if (reduced) {
			gsap.set(targets, { y: 0 });
			return;
		}
		const delay = parseFloat(el.getAttribute('data-split-delay') ?? '0');
		const stagger = parseFloat(el.getAttribute('data-split-stagger') ?? '0.045');
		gsap.to(targets, {
			y: 0,
			duration: 1.2,
			ease: EASE,
			stagger,
			delay,
			scrollTrigger:
				el.getAttribute('data-split-trigger') === 'load'
					? undefined
					: { trigger: el, start: 'top 85%', once: true },
		});
	});
}

function initReveal() {
	const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
	els.forEach((el) => {
		const direction = el.getAttribute('data-reveal') || 'up';
		const offset = parseFloat(el.getAttribute('data-reveal-offset') ?? '40');
		const delay = parseFloat(el.getAttribute('data-reveal-delay') ?? '0');
		const onLoad = el.getAttribute('data-reveal-trigger') === 'load';
		const from: gsap.TweenVars = { opacity: 0 };
		if (direction === 'up') from.y = offset;
		if (direction === 'down') from.y = -offset;
		if (direction === 'left') from.x = offset;
		if (direction === 'right') from.x = -offset;
		if (direction === 'scale') from.scale = 0.9;
		if (direction === 'blur') from.filter = 'blur(20px)';
		if (reduced) {
			gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0)' });
			return;
		}
		gsap.fromTo(
			el,
			from,
			{
				opacity: 1,
				x: 0,
				y: 0,
				scale: 1,
				filter: 'blur(0px)',
				duration: 1.1,
				ease: EASE,
				delay,
				scrollTrigger: onLoad
					? undefined
					: { trigger: el, start: 'top 88%', once: true },
			},
		);
	});
}

function initStagger() {
	const groups = document.querySelectorAll<HTMLElement>('[data-stagger]');
	groups.forEach((group) => {
		const children = Array.from(group.children) as HTMLElement[];
		gsap.set(children, { opacity: 0 });
		if (reduced) {
			gsap.set(children, { opacity: 1, y: 0 });
			return;
		}
		const offset = parseFloat(group.getAttribute('data-stagger-offset') ?? '32');
		const gap = parseFloat(group.getAttribute('data-stagger-gap') ?? '0.08');
		gsap.fromTo(
			children,
			{ opacity: 0, y: offset },
			{
				opacity: 1,
				y: 0,
				duration: 1,
				ease: EASE,
				stagger: gap,
				scrollTrigger: { trigger: group, start: 'top 88%', once: true },
			},
		);
	});
}

function initCountUp() {
	const els = document.querySelectorAll<HTMLElement>('[data-count]');
	els.forEach((el) => {
		const target = parseFloat(el.getAttribute('data-count') ?? '0');
		const suffix = el.getAttribute('data-count-suffix') ?? '';
		const prefix = el.getAttribute('data-count-prefix') ?? '';
		const decimals = parseInt(el.getAttribute('data-count-decimals') ?? '0', 10);
		const format = (v: number) =>
			`${prefix}${v.toLocaleString('en', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}`;
		if (reduced) {
			el.textContent = format(target);
			return;
		}
		const obj = { v: 0 };
		gsap.to(obj, {
			v: target,
			duration: 2.2,
			ease: FAST_EASE,
			onUpdate: () => {
				el.textContent = format(obj.v);
			},
			scrollTrigger: { trigger: el, start: 'top 90%', once: true },
		});
	});
}

function initMarquees() {
	const marquees = document.querySelectorAll<HTMLElement>('[data-marquee]');
	marquees.forEach((m) => {
		const track = m.querySelector<HTMLElement>('[data-marquee-track]');
		if (!track) return;
		const direction = m.getAttribute('data-marquee-direction') === 'right' ? 1 : -1;
		const speed = parseFloat(m.getAttribute('data-marquee-speed') ?? '60');
		const reactive = m.hasAttribute('data-marquee-reactive');
		const original = track.innerHTML;
		track.innerHTML = original + original + original;
		const w = track.scrollWidth / 3;
		gsap.set(track, { x: direction < 0 ? 0 : -w });
		if (reduced) return;
		const distance = w;
		const baseDuration = distance / speed;
		const tween = gsap.to(track, {
			x: direction < 0 ? -w : 0,
			duration: baseDuration,
			ease: 'none',
			repeat: -1,
		});
		if (reactive) {
			let lastY = window.scrollY;
			let velocity = 0;
			let raf = 0;
			const update = () => {
				const y = window.scrollY;
				velocity = velocity * 0.8 + Math.abs(y - lastY) * 0.2;
				lastY = y;
				const boost = 1 + Math.min(velocity * 0.05, 4);
				tween.timeScale(boost);
				raf = requestAnimationFrame(update);
			};
			raf = requestAnimationFrame(update);
			window.addEventListener('beforeunload', () => cancelAnimationFrame(raf));
		}
	});
}

function initMagnetic() {
	if (reduced) return;
	if (window.matchMedia('(pointer: coarse)').matches) return;
	const els = document.querySelectorAll<HTMLElement>('[data-magnet]');
	els.forEach((el) => {
		const strength = parseFloat(el.getAttribute('data-magnet') || '0.35');
		const inner = el.querySelector<HTMLElement>('[data-magnet-inner]') ?? el;
		el.addEventListener('mousemove', (e) => {
			const rect = el.getBoundingClientRect();
			const x = e.clientX - rect.left - rect.width / 2;
			const y = e.clientY - rect.top - rect.height / 2;
			gsap.to(inner, {
				x: x * strength,
				y: y * strength,
				duration: 0.6,
				ease: 'power3.out',
			});
		});
		el.addEventListener('mouseleave', () => {
			gsap.to(inner, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
		});
	});
}

function initHorizontalScroll() {
	const sections = document.querySelectorAll<HTMLElement>('[data-horizontal]');
	sections.forEach((section) => {
		const track = section.querySelector<HTMLElement>('[data-horizontal-track]');
		if (!track) return;
		if (window.innerWidth < 768 || reduced) return;
		const distance = track.scrollWidth - window.innerWidth;
		if (distance <= 0) return;
		gsap.to(track, {
			x: -distance,
			ease: 'none',
			scrollTrigger: {
				trigger: section,
				pin: true,
				start: 'top top',
				end: () => `+=${distance}`,
				scrub: 0.8,
				invalidateOnRefresh: true,
				anticipatePin: 1,
			},
		});
	});
}

function initParallax() {
	if (reduced) return;
	const els = document.querySelectorAll<HTMLElement>('[data-parallax]');
	els.forEach((el) => {
		const speed = parseFloat(el.getAttribute('data-parallax') || '0.2');
		gsap.fromTo(
			el,
			{ y: 0 },
			{
				y: () => window.innerHeight * speed * -1,
				ease: 'none',
				scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
			},
		);
	});
}

function initDrawPaths() {
	const els = document.querySelectorAll<HTMLElement>('[data-draw]');
	els.forEach((el) => {
		const paths = el.querySelectorAll<SVGPathElement | SVGLineElement | SVGCircleElement>(
			'path, line, circle, polyline, rect',
		);
		gsap.set(el, { opacity: 1 });
		if (paths.length === 0) return;
		paths.forEach((p) => {
			try {
				const length =
					'getTotalLength' in p && typeof p.getTotalLength === 'function'
						? p.getTotalLength()
						: 1000;
				p.style.strokeDasharray = `${length}`;
				p.style.strokeDashoffset = `${length}`;
			} catch {
				/* noop */
			}
		});
		if (reduced) {
			paths.forEach((p) => (p.style.strokeDashoffset = '0'));
			return;
		}
		const delay = parseFloat(el.getAttribute('data-draw-delay') ?? '0');
		const duration = parseFloat(el.getAttribute('data-draw-duration') ?? '2');
		gsap.to(paths, {
			strokeDashoffset: 0,
			duration,
			ease: 'power2.inOut',
			stagger: 0.08,
			delay,
			scrollTrigger: el.getAttribute('data-draw-trigger') === 'load'
				? undefined
				: { trigger: el, start: 'top 85%', once: true },
		});
	});
}

function initRotateOnScroll() {
	if (reduced) return;
	const els = document.querySelectorAll<HTMLElement>('[data-rotate-on-scroll]');
	els.forEach((el) => {
		const deg = parseFloat(el.getAttribute('data-rotate-on-scroll') || '360');
		gsap.to(el, {
			rotation: deg,
			ease: 'none',
			scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
		});
	});
}

function initMouseTrack() {
	if (reduced) return;
	const els = document.querySelectorAll<HTMLElement>('[data-mouse-track]');
	els.forEach((el) => {
		const strength = parseFloat(el.getAttribute('data-mouse-track') || '20');
		const targets = el.querySelectorAll<HTMLElement>('[data-mouse-target]');
		const items = targets.length ? Array.from(targets) : [el];
		const handleMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width - 0.5;
			const y = (e.clientY - rect.top) / rect.height - 0.5;
			items.forEach((item, i) => {
				const factor = parseFloat(item.getAttribute('data-mouse-factor') || `${1 + i * 0.3}`);
				gsap.to(item, {
					x: x * strength * factor,
					y: y * strength * factor,
					duration: 0.8,
					ease: 'power3.out',
				});
			});
		};
		el.addEventListener('mousemove', handleMove);
		el.addEventListener('mouseleave', () => {
			items.forEach((item) => gsap.to(item, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' }));
		});
	});
}

function initDetailsSmoothToggle() {
	const elements = document.querySelectorAll<HTMLDetailsElement>('details[data-smooth]');
	elements.forEach((el) => {
		const content = el.querySelector<HTMLElement>('[data-smooth-content]');
		if (!content) return;
		// Setup
		const summary = el.querySelector('summary');
		summary?.addEventListener('click', (e) => {
			if (reduced) return;
			e.preventDefault();
			if (el.open) {
				gsap.to(content, {
					height: 0,
					opacity: 0,
					duration: 0.4,
					ease: 'power2.in',
					onComplete: () => {
						el.open = false;
						content.style.height = '';
					},
				});
			} else {
				el.open = true;
				content.style.height = 'auto';
				const h = content.offsetHeight;
				gsap.fromTo(
					content,
					{ height: 0, opacity: 0 },
					{
						height: h,
						opacity: 1,
						duration: 0.5,
						ease: 'power2.out',
						onComplete: () => {
							content.style.height = '';
						},
					},
				);
			}
		});
	});
}

function initFloatY() {
	if (reduced) return;
	const els = document.querySelectorAll<HTMLElement>('[data-float]');
	els.forEach((el, i) => {
		const amount = parseFloat(el.getAttribute('data-float') || '12');
		const dur = parseFloat(el.getAttribute('data-float-duration') || '4');
		gsap.to(el, {
			y: amount,
			duration: dur,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
			delay: (i % 5) * 0.4,
		});
	});
}

function initScribble() {
	const els = document.querySelectorAll<HTMLElement>('[data-scribble]');
	els.forEach((el) => {
		const original = el.textContent ?? '';
		const chars = '!<>-_\\/[]{}—=+*^?#________';
		let frame = 0;
		let raf = 0;
		const run = () => {
			let out = '';
			let complete = 0;
			for (let i = 0; i < original.length; i++) {
				const start = Math.floor(Math.random() * 10);
				const end = start + Math.floor(Math.random() * 10);
				if (frame >= end) {
					complete++;
					out += original[i];
				} else if (frame >= start) {
					out += chars[Math.floor(Math.random() * chars.length)];
				} else {
					out += original[i];
				}
			}
			el.textContent = out;
			if (complete === original.length) {
				cancelAnimationFrame(raf);
				return;
			}
			frame++;
			raf = requestAnimationFrame(run);
		};
		el.addEventListener('mouseenter', () => {
			frame = 0;
			cancelAnimationFrame(raf);
			run();
		});
	});
}

function init() {
	initSplitReveal();
	initReveal();
	initStagger();
	initCountUp();
	initMarquees();
	initMagnetic();
	initParallax();
	initDrawPaths();
	initRotateOnScroll();
	initMouseTrack();
	initDetailsSmoothToggle();
	initFloatY();
	initScribble();
	initHorizontalScroll();
	requestAnimationFrame(() => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

window.addEventListener('load', () => ScrollTrigger.refresh());
