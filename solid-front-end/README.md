<p>
  <img alt="" src="https://badgen.net/badge/Dec/22,%202022/darkgray?scale=1.1&labelColor=darkgray&color=darkgray&cache=360000"  />
  <img alt="" src="https://badgen.net/badge/5/min%20read/darkgray?scale=1.1&labelColor=darkgray&color=darkgray&cache=360000" />
</p>

# A solid front-end

<img src="./static/article-01.png" align="right" width="55%"/>

#### I consider myself a funny guy; my mom says it's true.

(_Although some say that recognition effectiveness is proportional to the social distance of the recognizer. In this case, almost zero effectiveness._)[^1].

Since I'm going to share my thoughts about the mnemonic acronym _S.O.L.I.D_[^2]; I thought it'd be funny to illustrate the post using different states of water as part of the pun (well, maybe I'm not that funny after all).

---

_S.O.L.I.D_ stands for five principles of object-oriented design:

1. **S**ingle Responsibility
2. **O**pen-Closed
3. **L**iskov Substitution
4. **I**nterface Segregation
5. **D**ependency Inversion Principle

Although the S.O.L.I.D acronym is not purposely meant to mean "solid" in the sense of being sturdy, following them can help you create code that is more "solid" in the sense of being well-engineered.

---

#### I may not be funny, but you know what it is?

I know a lot of great developers that never heard of uncle Bob nor the meaning of _S.O.L.I.D_ principles (or even heard of but didn't go deep into it),
but when you go through their code, you can see each principle flawlessly applied. **But how could that be?**

It's worth noting that these principles can be applied (and are, on a daily basis) to front-end development (in React, to be more specific).
Here are my simple (code-snippet less) thoughts:

### Single responsibility principle

> "There should never be more than one reason to change a certain module."

Well, just keep it simple. I translate this as:

> "Every component, function, or module (independent of the abstraction size) should do only ONE thing."

If you have a page that fetches and displays a grid of (filterable and sortable) jokes, don't do everything in the same place; break large components that do too much into smaller components with one responsibility each and separate utility functions (such as filtering and sorting) that handles only one thing at a time. You can also encapsulate connected functionality as the fetch, useState, and useEffect in a custom useJokes hook if you like (It's not for my taste, but it's a known practice)

### Open-closed principle

> "Modules should be open for extension but closed for modification."

I see this as:

> "Allow a component to be flexible and extendable without hard-coding a lot of conditionals and having to change their original code for every little simple thing you have to add"

My translation is longer, but it is what it is. Take this as an example: Imagine that I have a toaster component that consists in showing an icon and a message. Instead of creating a prop called `type` that would accept a string union type like `'default' | 'warning' | 'error'` , following with a lot of conditionals to control which icon the component will show, just add a prop `icon` as a `React.ReactNode` type instead.

If someday you have to add an 'info' type to this toaster, you could pass the new icon as a prop. (of course, there would be other modifications besides the icon, like background color and stuff - but you got the idea).

### (Barbara) Liskov substitution principle

> "Subtypes must be substitutable for their base types."

What? Let's break it down: <br />
The relationship between a subclass and a superclass is usually created using class inheritance. Thinking in React itself, it's a little different. Inheritance, in this case, is when one component is based on another component while keeping a similar implementation. We deal with this every minute of our days using CSS-in-JS.

Let's imagine you just created a `Styled(input)`, right?

This is a perfect example of a subtype/supertype relationship.
This new `StyledInput` component may add or override a few css styles, however, it retains the exact same implementation (or contract) of the original input, meaning that, you could use the same props you'd use on the regular `input` on the new `StyledInput`, and also means, that you could easily replace the `StyledInput` with the regular `input` and this wouldn't break anything because both sub and super are using the same interface. This is _LSP_.

It's important to recognize that it is **not always appropriate** to follow this principle. In many cases, we create 'subtypes' (subcomponents, in this case) with the intention of adding new feat. that won't be available in the super component, and this is fine! Do not try to force the LSP everywhere.

### Interface segregation principle

> "Don't expose methods to your client, methods that they don't use."

This one is pretty simple; I'd translate that as:

> "Pass only the props the component will, in fact, use."

Lots of times, we see a component that receives a full object via props; inside this component you see a destructuring assignment unpacking only ONE property of the object _(This also can happen when dealing with Graphql and not using fragments properly);_ This is going against ISP.

### Dependency inversion principle

> "Depend on abstractions."

Here we are basically saying that, in some cases, one component should be independent of another component. They both should depend on a common abstraction. React also enforces this as good practice.

Let's imagine we have a component called `SubscriptionForm` that holds a simple form. When we submit this form, it calls an api responsible for persisting data. This principle says: **Don't call the API directly from `SubscriptionForm`**; this would be creating a tight coupling between them; instead, add an `onSubmit` prop on `SubscriptionForm`, call the api from its parent and pass it as something as a `handleSubmit` function.

See how we inverted the dependency here, breaking such coupling?

<img src="./static/article-02.png"  width="100%"/>

<br />

Did you notice? All we did here were some good practices in React.

Oh, one more thing - regardless if you work with front-end or back-end, _S.O.L.I.D_ is not a STRICT set of rules that MUST be followed at all times. It's a set of guidelines among the huge spectrum of tools/libraries and things that helps us make good design decisions. It's all up to us, after all.

These principles were based on fundamental concepts on how to write nice code.
Good developers, as they gain experience, tend to always naturally gravitate around these principles (even before the acronym existed).
Barbara Liskov introduced LSP 12 years before uncle bob said anything about SOLID (obviously).

The principles existed before they existed. (????)

[^1]: "Les circuits de consécration sociale, sera d'autant plus efficace plus la distance sociale de l'objet consacrée" - Pierre Bourdieu

[^2]: [Principles of OOD](http://www.butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod) - Robert Martin (a.k.a Uncle Bob)
