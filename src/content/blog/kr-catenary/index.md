---
title: KR Catenary
description: Script to generate some real-time catenary curves.
date: 2026-11-09
cover: ./cover.webp
coverAlt: Catenary rig tool for Autodesk Maya
tags: [Maya, MEL, Rigging tool, Math, Curves]
externalUrl: https://kevinrosso.gumroad.com/l/catenary
externalLabel: Get it on Gumroad
---
Inspired by the [work](https://youtu.be/gSLtLl--G1A?si=LxN8G-4Dp4mgaDNs&t=67) done by Sony Pictures Imageworks for the ropes in The Sea Beast (2022), I created a script to automatically rig any hanging cable.

**[Catenary curves](https://en.wikipedia.org/wiki/Catenary)**, this is what they're called, are present all around us, also in spider webs!

*If you find it hard to follow the math, no worries! I created a [simple script](#4-script) that allows you to create a catenary with just 1 click.*

---

## 1. Math

What makes catenaries hard to implement in Maya, is that they require **iteration** to be solved.

Alan Zucconi made a great [post series](https://web.archive.org/web/20260218025836/https://www.alanzucconi.com/2020/12/13/catenary-1/) about these, but unfortunately we cannot use an indefinite amount of iterations, like in a game engine. **We'd risk to freeze Maya!**

Luckily, I found [this post](https://web.archive.org/web/20240912221543/https://math.stackexchange.com/questions/3557767/how-to-construct-a-catenary-of-a-specified-length-through-two-specified-points#mjx-eqn-fdef). The top answer is claiming that <mark>"This will take at most 5 iterations"</mark>, so I tried to recreate it in GeoGebra:

<div class="embed-crop" style="--crop-left: 0.24; --crop-right: 0.08">
<iframe scrolling="no" title="Catenary between two points" src="https://www.geogebra.org/material/iframe/id/ptpy5xfn/width/2560/height/1253/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/false/rc/false/ld/false/sdz/false/ctl/false" width="2560px" height="1253px" style="border:0px;"> </iframe>
</div>

---

## 2. Recreation in Maya

I chose to use Maya expressions to recreate the function, since this makes the setup fully portable.

### 2.1 Hyperbolic functions
First of all I had to define hyperbolic functions that aren't present in Maya:
```mel
// FUNCTIONS
global proc float sinh(float $x) {
	$e = 2.718281828459;
	$ret = (pow($e, $x) - pow($e, -$x))/2;
	return($ret);
}
global proc float cosh(float $x) {
	$e = 2.718281828459;
	$ret = (pow($e, $x) + pow($e, -$x))/2;
	return($ret);
}
global proc float atanh(float $x) {
	$ret = 0.5 * log((1+$x)/(1-$x));
	return($ret);
}
```

### 2.2 Base variables 
Moving on to the actual function, I used two locators as **start and end point** of the catenary, obtaining the relative vectors. I also used an attribute on the `expression` node to define the **length of the catenary**:
```mel
// VARIABLES
$startV = <<startLoc.translateX, startLoc.translateY, startLoc.translateZ>>;
$endV = <<endLoc.translateX, endLoc.translateY, endLoc.translateZ>>;

$len = catenary_exp.length;
```

### 2.3 Finding $r$
Now we can use our variables to find the base data needed for the iteration.

$r$ compares the cable length to the horizontal distance: the bigger it is, the more the curve sags.

```mel
// BASE DATA
$endVLocal = $endV-$startV;
$dx = mag(<<$endVLocal.x, 0, $endVLocal.z>>);
$dy = mag(<<0, $endVLocal.y, 0>>);

$r = sqrt(pow($len, 2)-pow($dy, 2))/$dx;
```

### 2.4 Iteration
As stated previously, we can't iterate indefinitely until $|r−\frac{\sinh(\mathbf{A}_n)}{\mathbf{A}_n}|<10^{−10}r$, as the original answer does.

Since it said that this could be achieved with few iterations, I use 10 to be safe. It’s still instant even with many curves in a scene.

```mel
// ITERATION
$A0 = log(2*$r)+log(log(2*$r));
$A = $A0;
for($i=0; $i<10; $i++){
    $A = $A - ((sinh($A) - ($r*$A))/(cosh($A)-$r));
}
```

### 2.5 Final data
We can now find $a, b$ and $c$ that are needed for the catenary function.

```mel
// FINAL DATA
$xb = $dx/2;

$a = $dx/(2*$A);
$b = $xb - $a*atanh($dy/$len);
$c = -$a * cosh(-$b/$a);
```

### 2.6 Catenary function
We can now calculate the catenary function, switching to a linear interpolation if the distance between `startLoc` and `endLoc` is greater than the length `$len`.

```mel
$linear = $x * ($dy/$dx);
$catenary = $a*cosh(($x-$b)/$a) + $c;
if ($r>1){
    return($catenary+$startV.y);
} else{
    return($linear+$startV.y);
}
```

---

## 3. Final expression
And here is the final expression, which calculates the Y axis for each X position along the curve.

```mel
// FUNCTIONS
global proc float sinh(float $x) {
	$e = 2.718281828459;
	$ret = (pow($e, $x) - pow($e, -$x))/2;
	return($ret);
}
global proc float cosh(float $x) {
	$e = 2.718281828459;
	$ret = (pow($e, $x) + pow($e, -$x))/2;
	return($ret);
}
global proc float atanh(float $x) {
	$ret = 0.5 * log((1+$x)/(1-$x));
	return($ret);
}


global proc float catenary(float $x) {
	// VARIABLES
	$startV = <<startLoc.translateX, startLoc.translateY, startLoc.translateZ>>;
	$endV = <<endLoc.translateX, endLoc.translateY, endLoc.translateZ>>;
	
	$len = catenary_exp.length;
	
	// BASE DATA
	$endVLocal = $endV-$startV;
	$dx = mag(<<$endVLocal.x, 0, $endVLocal.z>>);
	$dy = mag(<<0, $endVLocal.y, 0>>);
	
	$r = sqrt(pow($len, 2)-pow($dy, 2))/$dx;
	
	// ITERATION
	$A0 = log(2*$r)+log(log(2*$r));
	$A = $A0;
	for($i=0; $i<10; $i++){
		$A = $A - ((sinh($A) - ($r*$A))/(cosh($A)-$r));
	}
	
	// FINAL DATA
	$xb = $dx/2;
	
	$a = $dx/(2*$A);
	$b = $xb - $a*atanh($dy/$len);
	$c = -$a * cosh(-$b/$a);
	
	$linear = $x * ($dy/$dx);
	$catenary = $a*cosh(($x-$b)/$a) + $c;
	if ($r>1){
		return($catenary+$startV.y);
	} else{
		return($linear+$startV.y);
	}
}

// EXAMPLE USAGE
$startV = <<startLoc.translateX, 0, startLoc.translateZ>>;
$midV = <<midLoc_01.translateX, 0, midLoc_01.translateZ>>;
midLoc_01.translateY = catenary(mag($midV-$startV));
```

---

## 4. Script
I created a script to automatically create a catenary out of any curve with just a click.

It's production-ready and super fast!

<div style="padding:75% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/993962995?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;loop=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="KR Catenary Rig"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

<div class="space-sm"></div>

**Instructions:**
- Drag the python script into Maya's script editor
- Select the curves that you want to rig
- Launch the script
- Enjoy!
