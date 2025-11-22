FROM --platform=linux/386 i386/alpine:3.19

# For Alpine, we use apk with --no-cache
ARG DEBIAN_FRONTEND=noninteractive

# Install dependencies:
# gcompat: for glibc compatibility
# xorg-server: the X server
# xinit: to start X
# xf86-video-vesa: a generic video driver
# xterm: for testing X11
# And create a 'user'
RUN apk add --no-cache \
        gcompat \
        xorg-server \
        xinit \
        xf86-video-vesa \
        xterm \
    && adduser -m -D user \
    && echo "user:password" | chpasswd \
    && echo "root:password" | chpasswd

# Set the default command (optional, but good practice)
CMD [ "/bin/sh" ]
